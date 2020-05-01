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

import municipios from './municipios_boundingbox';

export const parse_mun = () => {

    const municipios_bounds = municipios.features
        .filter(municipio => municipio.properties['ine:municipio'])
        .map((municipio) => {

        const bounds = municipio.geometry.coordinates[0].reduce(function (bounds, coord) {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds());

        return {
            ine: municipio.properties['ine:municipio'],
            bounds: [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ]
        }
    })

    console.log(municipios_bounds);

};