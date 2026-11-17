// The BMP map layer, shared by the main map and the location picker for new BMPs
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import Extent from '@arcgis/core/geometry/Extent.js'
import type { BmpRecord } from '../data/bmps.ts'

export const BMP_LAYER_ID = 'umbc-bmps';

const BMP_FIELDS = [
  { name: 'OBJECTID', type: 'oid' as const },
  { name: 'name', type: 'string' as const },
  { name: 'trackingNumber', type: 'string' as const },
  { name: 'facilityType', type: 'string' as const },
];

function bmpAttributes(r: BmpRecord, i: number) {
  return { OBJECTID: i + 1, name: r.name ?? r.trackingNumber, trackingNumber: r.trackingNumber, facilityType: r.facilityType };
}

// Our own BMP layer, built from the outlines in UMBC's SWM Tracking geodatabase
// (plus the BMPs added in the app). The web map's "BMP Database" layer is an older, partial copy.
export function createBmpLayer(records: BmpRecord[]) {
  return new FeatureLayer({
    id: BMP_LAYER_ID,
    title: 'BMPs',
    objectIdField: 'OBJECTID',
    fields: BMP_FIELDS,
    spatialReference: { wkid: 4326 },
    outFields: ['*'],
    popupTemplate: { title: '{name}', content: 'BMP ID: {trackingNumber}<br>Type: {facilityType}' },
    geometryType: 'polygon',
    source: records.map((r, i) => new Graphic({
      geometry: { type: 'polygon', rings: r.shape, spatialReference: { wkid: 4326 } },
      attributes: bmpAttributes(r, i),
    })),
    renderer: {
      type: 'simple',
      symbol: { type: 'simple-fill', color: [247, 204, 13, 0.35], outline: { color: '#f7cc0d', width: 1.5 } },
    },
  });
}

// The BMPs plus a margin (degrees; 0.002 is ~200 m)
export function extentAround(records: { lat: number; lon: number }[], pad = 0.002) {
  const lons = records.map(r => r.lon), lats = records.map(r => r.lat);
  return new Extent({
    xmin: Math.min(...lons) - pad, xmax: Math.max(...lons) + pad,
    ymin: Math.min(...lats) - pad, ymax: Math.max(...lats) + pad,
    spatialReference: { wkid: 4326 },
  });
}
