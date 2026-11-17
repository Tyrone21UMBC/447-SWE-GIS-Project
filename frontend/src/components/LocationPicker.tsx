// Click-to-place map for a new BMP's location. Loaded on demand (React.lazy),
// so the Admin page doesn't download ArcGIS until the Add BMP form opens.
import { useEffect, useRef, useState } from 'react';
import '@arcgis/map-components/dist/components/arcgis-map'
import '@arcgis/map-components/dist/components/arcgis-zoom'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import Point from '@arcgis/core/geometry/Point.js'
import Extent from '@arcgis/core/geometry/Extent.js'
import { createBmpLayer } from '../map/bmpLayer.ts'
import { ADD_BOUNDS, type BmpRecord } from '../data/bmps.ts'

export type LatLon = { lat: number; lon: number };
type Props = { value: LatLon | null; onChange: (value: LatLon) => void; records: BmpRecord[] };

const PIN = { type: 'simple-marker' as const, style: 'circle' as const, size: 16, color: '#e11d48', outline: { color: '#fff', width: 2 } };
const BOUNDS = new Extent({
  xmin: ADD_BOUNDS.lon[0], xmax: ADD_BOUNDS.lon[1], ymin: ADD_BOUNDS.lat[0], ymax: ADD_BOUNDS.lat[1],
  spatialReference: { wkid: 4326 },
});
const round = (n: number) => Math.round(n * 1e6) / 1e6;   // ~10 cm

export default function LocationPicker({ value, onChange, records }: Props) {
  const mapRef = useRef<any>(null);
  // Center once: following every click would make the map jump around under the cursor
  const [start] = useState(value);
  const pins = useRef(new GraphicsLayer({ title: 'New BMP' }));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    let clickHandle: { remove(): void } | undefined;
    const ready = () => {
      const view = el.view;
      if (!view?.map || clickHandle) return;
      view.constraints = { geometry: BOUNDS, minScale: 20000, maxScale: 300, rotationEnabled: false };
      // Existing BMPs for reference, under the pin; clicks place the pin rather than open popups
      view.map.addMany([createBmpLayer(records), pins.current]);
      view.popupEnabled = false;
      clickHandle = view.on('click', (event: any) => {
        const { latitude, longitude } = event.mapPoint;
        onChangeRef.current({ lat: round(latitude), lon: round(longitude) });
      });
    };
    el.addEventListener('arcgisViewReadyChange', ready);
    ready();
    return () => {
      el.removeEventListener('arcgisViewReadyChange', ready);
      clickHandle?.remove();
    };
    // The reference layer is built once; the list doesn't change while the form is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin on the chosen spot (also when the coordinates are typed in)
  useEffect(() => {
    pins.current.removeAll();
    if (value) {
      pins.current.add(new Graphic({
        geometry: new Point({ latitude: value.lat, longitude: value.lon }),
        symbol: PIN,
      }));
    }
  }, [value]);

  return (
    <arcgis-map
      ref={mapRef}
      basemap="hybrid"
      center={start ? `${start.lon},${start.lat}` : '-76.7115,39.2555'}
      scale={start ? 2500 : 9000}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    >
      <arcgis-zoom slot="top-left"></arcgis-zoom>
    </arcgis-map>
  );
}
