import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'


var map = new mapboxgl.Map({
    container: 'map',
    style: 'http://demo.geomati.co:8090/styles/klokantech-basic/style.json',
    center: [-3.69, 40.41],
    zoom: 6,
    bearing: 0
});

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({position: 'bottom-right'}));

