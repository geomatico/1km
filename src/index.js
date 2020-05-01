import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import turfCircle from '@turf/circle';
import {point as turfPoint} from '@turf/helpers'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import mun_bbox from './mun_bbox';

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VvbWF0aWNvIiwiYSI6ImNrOWVwbDZkNjAzeXEzbWp3OGtscmI2N2sifQ.qed5igebU5jj0xOeiWtHYQ'
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    //style: 'https://geoserveis.icgc.cat/contextmaps/osm-bright.json',
    //style: 'img/osm-bright-icgc-cloudfront.json',
    center: [-3.69, 40.41],
    zoom: 6,
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

const showMunicipality = function (e) {
    const point = map.project(e.lngLat);
    const municipalities = map.queryRenderedFeatures(
        point,
        {layers: ['fill_municipios']});
    if (municipalities.length === 1) {
        const municipality = municipalities[0];

        current_municipality = municipality.properties['ine:municipio'];

        map.setFilter('selected_municipality', ['==', 'ine:municipio', municipality.properties['ine:municipio']])
    }
}

map.on('zoomend', e => {
    if (e.hasOwnProperty('lngLat')) {
        showMunicipality(e)
    }
});

const zoomTo = function (name) {
    switch (name) {
        case 'km':
            map.fitBounds(buffer_bounds, {padding: 25});
            break;
        case 'municipio':
            if (current_municipality) {
                const mun = mun_bbox.filter(mun => mun['ine'] === current_municipality)[0];
                const bounds = new mapboxgl.LngLatBounds(mun.bounds);
                map.fitBounds(bounds, {padding: 25});
            }
            break;
        default:
            break;
    }
}

var listItems = document.querySelectorAll('.mdc-bottom-navigation__list-item');
var activated = 'mdc-bottom-navigation__list-item--activated';
for (var i = 0, list; list = listItems[i]; i++) {
    list.addEventListener('click', function (event) {
        [...document.querySelectorAll('.mdc-bottom-navigation__list-item')].map(el => el.classList.remove(activated));
        var el = event.target;
        el.classList.add(activated);
        zoomTo(el.dataset.id);
    });
}

const set1kmActivate = function() {
    [...document.querySelectorAll('.mdc-bottom-navigation__list-item')].map(el => el.classList.remove(activated));
    var el = document.querySelector('span[data-id="km"]');
    el.classList.add(activated);
}

map.on('drag', function (e) {
    document.getElementById('openSidebarMenu').checked = false;
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: 'Busca tu casa...',
        zoom: 17,
        marker: false,
        language: 'es-ES',
        countries: 'es',
        minLength: 3
    })
);
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({position: 'bottom-right'}));

map.on('load', function (e) {

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
        createBuffer(e);
        showMunicipality(e);
        set1kmActivate();
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
