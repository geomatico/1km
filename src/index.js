import i18n from '../i18n';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import turfCircle from '@turf/circle';
import {point as turfPoint} from '@turf/helpers'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import mun_bbox from './mun_bbox';

const lang = i18n.languages[0];

const i18nBundle = i18n.getDataByLanguage(lang);
if(i18nBundle) {
    for (let i in i18nBundle.translation) {
        [...document.querySelectorAll("[data-i18n='" + i + "']")].map(el => {
            if (el && el.innerHTML) {
                el.innerHTML = i18nBundle.translation[i];
            }
        });
    }
}

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VvbWF0aWNvIiwiYSI6ImNrOWVwbDZkNjAzeXEzbWp3OGtscmI2N2sifQ.qed5igebU5jj0xOeiWtHYQ'
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    //style: 'https://geoserveis.icgc.cat/contextmaps/osm-bright.json',
    //style: 'img/osm-bright-icgc-cloudfront.json',
    center: [-3.69, 40.41],
    zoom: 5,
    bearing: 0
});

const geolocationControl = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    showUserLocation: false
})

let buffer_bounds = undefined;
let current_municipality = undefined;

const createBuffer = function (e) {
    const center = turfPoint([e.lngLat.lng, e.lngLat.lat]);
    const radius = 1;
    const options = {steps: 100, units: 'kilometers', properties: {foo: 'bar'}};
    const circle = turfCircle(center, radius, options);

    map.getSource('buffer_center').setData(center);
    map.getSource('buffer').setData(circle);

    const bounds = circle.geometry.coordinates[0].reduce(function (bounds, coord) {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds());

    buffer_bounds = bounds;

    map.fitBounds(bounds, {padding: 25}, {lngLat: e.lngLat});
}

const showMunicipality = function (lngLat) {
    const point = map.project(lngLat);
    const municipalities = map.queryRenderedFeatures(
        point,
        {layers: ['fill_municipios']});
    if (municipalities.length === 1) {
        current_municipality = municipalities[0].properties['ine:municipio'];
        map.setFilter('selected_municipality', ['==', 'ine:municipio', current_municipality])
    }
}

map.on('zoomend', e => {
    if (e.hasOwnProperty('lngLat')) {
        map.once('idle', e2 => {
            showMunicipality(e.lngLat)
            showButtons()
        })
    }
});

const zoomTo = function (type) {
    switch (type) {
        case 'km':
            if(buffer_bounds) {
                map.fitBounds(buffer_bounds, {padding: 25});
                setActiveButton(type);
            }
            break;
        case 'municipio':
            if (current_municipality) {
                const mun = mun_bbox.filter(mun => mun['ine'] === current_municipality)[0];
                const bounds = new mapboxgl.LngLatBounds(mun.bounds);
                map.fitBounds(bounds, {padding: 60});
                setActiveButton(type);
            }
            break;
        default:
            break;
    }
}

var listItems = document.querySelectorAll('.mdc-bottom-navigation__list-item');
for (var i = 0, list; list = listItems[i]; i++) {
    list.addEventListener('click', function (event) {
        zoomTo(event.target.dataset.id);
    });
}

const showButtons = function() {
    [...document.querySelectorAll('.mdc-bottom-navigation__list-item')].map(el => el.style.opacity = '1');
}

const hideButtons = function() {
    [...document.querySelectorAll('.mdc-bottom-navigation__list-item')].map(el => el.style.opacity = '0');
}

const setActiveButton = function(type) {
    var activatedClass = 'mdc-bottom-navigation__list-item--activated';
    [...document.querySelectorAll('.mdc-bottom-navigation__list-item')].map(el => el.classList.remove(activatedClass));
    if(type) {
        var el = document.querySelector('span[data-id="'+type+'"]');
        el.classList.add(activatedClass);
    }
}

map.on('drag', function (e) {
    document.getElementById('openSidebarMenu').checked = false;
    setActiveButton(undefined);
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: i18n.t('search'),
        zoom: 17,
        marker: false,
        language: lang,
        countries: 'es',
        minLength: 3
    })
);
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({position: 'bottom-right'}));

map.on('load', function (e) {

    // Use international map
    const labelList = map.getStyle().layers.filter(layer => {
        return /-label/.test(layer.id);
    });
    for (let labelLayer of labelList) {
        map.setLayoutProperty(labelLayer.id, 'text-field', ['coalesce', ['get', 'name_int'], ['get', 'name']]);
    }

    map.addSource('src_limites_adm', {
        type: 'vector',
        url: 'mapbox://geomatico.54v7p84m'
    });

    map.addLayer({
        'id': 'fill_municipios',
        'type': 'fill',
        'source': 'src_limites_adm',
        'source-layer': 'municipios_osm',
        'layout': {},
        'paint': {
            'fill-outline-color': '#444',
            'fill-color': '#888',
            'fill-opacity': 0
        }
    }, 'building-number-label');

    map.addLayer({
        'id': 'boundary_municipios',
        'type': 'line',
        'source': 'src_limites_adm',
        'source-layer': 'municipios_osm',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#696969',
            'line-width': 0.5,
            'line-opacity': [
                'interpolate',
                ['exponential', 0.5],
                ['zoom'],
                7, 0.1,
                15, 0.5,
                22, 0.7
            ]
        }
    }, 'building-number-label');

    map.addLayer({
        'id': 'boundary_provincias',
        'type': 'line',
        'source': 'src_limites_adm',
        'source-layer': 'provincias_osm',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#888888',
            'line-width': [
                'interpolate',
                ['exponential', 0.5],
                ['zoom'],
                7, 1.5,
                18, 2.5
            ],
            'line-opacity': [
                'interpolate',
                ['exponential', 0.5],
                ['zoom'],
                7, 0.2,
                18, 0.5
            ]
        }
    }, 'building-number-label');

    map.addLayer({
        'id': 'selected_municipality',
        'type': 'line',
        'source': 'src_limites_adm',
        'source-layer': 'municipios_osm',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#973572',
            'line-width': 4,
            'line-opacity': 0.67
        },
        'filter': ['==', 'ine:municipio', '']
    }, 'building-number-label');

    map.addSource('buffer', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });
    map.addSource('buffer_center', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    map.addLayer({
        'id': 'buffer',
        'type': 'fill',
        'source': 'buffer',
        'paint': {
            'fill-color': '#973572',
            'fill-opacity': 0.3
        }
    });

    map.addLayer({
        'id': 'buffer_center',
        'type': 'circle',
        'source': 'buffer_center',
        'paint': {
            'circle-color': '#973572',
            'circle-radius': 5,
            'circle-stroke-color': '#FFF',
            'circle-stroke-width': 2
        }
    });

    map.on('click', function f(e) {
        document.getElementById('openSidebarMenu').checked = false;
        hideButtons();
        current_municipality = undefined;
        createBuffer(e);
        setActiveButton("km");
    });

    map.addControl(geolocationControl);

    geolocationControl.on('geolocate', function (position) {
        document.getElementById('openSidebarMenu').checked = false;
        createBuffer({
            lngLat: {
                lng: position.coords.longitude,
                lat: position.coords.latitude
            }
        });
    })
})
