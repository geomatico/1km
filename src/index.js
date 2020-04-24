import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import turfCircle from '@turf/circle'
import {point as turfPoint} from '@turf/helpers'
import HelpControl from './help-control'

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VvbWF0aWNvIiwiYSI6ImNrOWQyYnZnMzA0Y2gzZnBsajkzdTV1eW0ifQ.Sdirap8fgylWmhv6iBxUOA'
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
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
    
    map.fitBounds(bounds, {padding: 25});
}

map.on('drag', function(e) {
    document.getElementById('openSidebarMenu').checked = false;
});

map.addControl(new HelpControl());
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({position: 'bottom-right'}));

map.on('load', function(e) {
    
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
        document.getElementById('welcome').style.display='none'
        createBuffer(e)
    });

    map.addControl(geolocationControl);

    geolocationControl.on('geolocate', function(position) {
        document.getElementById('welcome').style.display='none'
        createBuffer({
            lngLat: {
                lng: position.coords.longitude,
                lat: position.coords.latitude
            }
        });
    })
})
