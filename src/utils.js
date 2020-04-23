import proj4 from "proj4";
import mapboxgl from "mapbox-gl";


export const from3857_to4326 = coord => {
    return proj4('EPSG:3857', 'EPSG:4326', coord)
};

export const getBoundsFromFeatures = features => {
    let bounds = new mapboxgl.LngLatBounds();
    features.map(feature => bounds.extend(feature.geometry.coordinates));
    return bounds;
};