import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import turfCircle from '@turf/circle';
import {point as turfPoint} from '@turf/helpers'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'

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

const createBuffer = function(e) {
    const center = turfPoint([e.lngLat.lng, e.lngLat.lat]);
    const radius = 1;
    const options = {steps: 100, units: 'kilometers', properties: {foo: 'bar'}};
    const circle = turfCircle(center, radius, options);

    map.getSource('buffer_center').setData(center);
    map.getSource('buffer').setData(circle);

    const bounds = circle.geometry.coordinates[0].reduce(function (bounds, coord) {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds());

    map.fitBounds(bounds, {padding: 25}, {lngLat: e.lngLat});
}

const showMunicipality = function(e) {
    const point = map.project(e.lngLat);
    const municipalities = map.queryRenderedFeatures(
        point,
        { layers: ['fill_municipios'] });
    if (municipalities.length === 1) {
        const municipality = municipalities[0]
        map.setFilter('selected_municipality', ['==', 'NAMEUNIT', municipality.properties.NAMEUNIT])
    }
}

map.on('zoomend', e => {
    if (e.hasOwnProperty('lngLat')) {
        showMunicipality(e)
    }
});

map.on('drag', function(e) {
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

map.on('load', function(e) {

    map.addSource('src_municipios', {
        type: 'vector',
        url: 'mapbox://geomatico.bkiobfd2'
    });

    map.addLayer({
        'id': 'fill_municipios',
        'type': 'fill',
        'source': 'src_municipios',
        'source-layer': 'municipios-4nse5n',
        'layout': {
        },
        'paint': {
            'fill-outline-color': '#444',
            'fill-color': '#888',
            'fill-opacity': 0
        }
    });

    map.addLayer({
        'id': 'boundary_municipios',
        'type': 'line',
        'source': 'src_municipios',
        'source-layer': 'municipios-4nse5n',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#444',
            'line-width': 1,
            'line-opacity': 0.67
        }
    });

    map.addLayer({
        'id': 'selected_municipality',
        'type': 'line',
        'source': 'src_municipios',
        'source-layer': 'municipios-4nse5n',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#973572',
            'line-width': 4,
            'line-opacity': 0.67
        },
        'filter': ['==', 'NAMEUNIT', '']
    });

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
        createBuffer(e)
        showMunicipality(e)
    });

    map.addControl(geolocationControl);

    geolocationControl.on('geolocate', function(position) {
        document.getElementById('openSidebarMenu').checked = false;
        createBuffer({
            lngLat: {
                lng: position.coords.longitude,
                lat: position.coords.latitude
            }
        });
    })
})
