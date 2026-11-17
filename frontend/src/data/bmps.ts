// BMPs from UMBC's SWM Tracking geodatabase (the source of truth), plus any an
// admin has added in the app (stored by the backend, see useBmps below).
// bmps.json is generated: after the geodatabase changes, rerun
//   python3 scripts/convert_gis.py "<UMBC SWM Tracking.gdb>" --master "<master list .xlsx>"
import { useEffect, useSyncExternalStore } from 'react';
import records from './bmps.json';
import { apiFetch } from '../auth.ts';

export type BmpRecord = {
  trackingNumber: string;      // SWM Tracking Number, e.g. "11-SF-0048-02" (unique)
  sfNumber?: string;           // MDE SF Number (the plan number)
  prfNumber?: string;
  facilityType?: string;
  outfallPoint?: string;
  drainageArea?: string;
  drainageAreaSf?: number;
  esdv?: number;
  // The geodatabase has no fields for these, so they come from the master list
  name?: string;
  mdeClosure?: string;         // ISO date, or text such as "No"
  lat: number;                 // center of the outline
  lon: number;
  shape: number[][][];         // outline rings of [lon, lat]
  added?: { id: number; by: string | null; at: string };   // set for BMPs added in the app
};

export const BMP_RECORDS = records as BmpRecord[];

// Same rules as the backend (schema.py BmpCreate)
export const TRACKING_NUMBER_PATTERN = /^\d{2}-[A-Z]{2}-\d{4}-\d{1,2}[A-Z]?$/;
export const SF_NUMBER_PATTERN = /^\d{2}-[A-Z]{2}-\d{4}$/;
export const ADD_BOUNDS = { lat: [39.24, 39.27], lon: [-76.73, -76.69] } as const;

export type NewBmp = {
  tracking_number: string;
  name: string;
  facility_type: string;
  sf_number?: string;
  outfall_point?: string;
  drainage_area?: string;
  in_service?: string;         // YYYY-MM-DD
  lat: number;
  lon: number;
};
type ApiBmp = Required<Omit<NewBmp, 'sf_number' | 'outfall_point' | 'drainage_area' | 'in_service'>> & {
  id: number;
  sf_number: string | null;
  outfall_point: string | null;
  drainage_area: string | null;
  in_service: string | null;
  created_by: string | null;
  created_at: string;
};

// App-added BMPs have a point, not an outline: draw a small octagon (~6 m across)
// so they show and click like the rest
function marker(lon: number, lat: number): number[][][] {
  const radius = 6, metersPerDegree = 111_320;
  const ring = Array.from({ length: 9 }, (_, i) => {
    const angle = (i % 8) * Math.PI / 4;
    return [
      lon + (radius * Math.cos(angle)) / (metersPerDegree * Math.cos(lat * Math.PI / 180)),
      lat + (radius * Math.sin(angle)) / metersPerDegree,
    ];
  });
  return [ring];
}

const fromApi = (b: ApiBmp): BmpRecord => ({
  trackingNumber: b.tracking_number,
  name: b.name,
  facilityType: b.facility_type,
  sfNumber: b.sf_number ?? undefined,
  outfallPoint: b.outfall_point ?? undefined,
  drainageArea: b.drainage_area ?? undefined,
  mdeClosure: b.in_service ?? undefined,
  lat: b.lat,
  lon: b.lon,
  shape: marker(b.lon, b.lat),
  added: { id: b.id, by: b.created_by, at: b.created_at },
});

const GIS_IDS = new Set(BMP_RECORDS.map(r => r.trackingNumber));

// The combined list, shared by every page. The geodatabase wins if both have an ID,
// so a BMP added here and later digitized in GIS isn't shown twice.
let added: BmpRecord[] = [];
let snapshot = { records: BMP_RECORDS, loaded: false };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function publish(loaded = snapshot.loaded) {
  const extra = added.filter(r => !GIS_IDS.has(r.trackingNumber));
  snapshot = { records: extra.length ? [...BMP_RECORDS, ...extra] : BMP_RECORDS, loaded };
  listeners.forEach(l => l());
}

function loadAddedBmps() {
  loading ??= (async () => {
    try {
      const res = await apiFetch('/bmps');
      if (!res.ok) throw new Error();
      added = (await res.json() as ApiBmp[]).map(fromApi);
    } catch {
      loading = null;   // the GIS BMPs still show; try again on the next page
    }
    publish(true);
  })();
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useBmps() {
  useEffect(() => { loadAddedBmps(); }, []);
  return useSyncExternalStore(subscribe, () => snapshot);
}

export function getBmp(trackingNumber: string | undefined, list = snapshot.records): BmpRecord | null {
  const id = trackingNumber?.trim();
  return id ? list.find(r => r.trackingNumber === id) ?? null : null;
}

const detail = async (res: Response, fallback: string) => {
  const body = await res.json().catch(() => ({}));
  return typeof body.detail === 'string' ? body.detail : fallback;
};

export async function addBmp(bmp: NewBmp): Promise<BmpRecord> {
  const res = await apiFetch('/bmps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bmp),
  });
  if (!res.ok) throw new Error(await detail(res, 'Could not add the BMP'));
  const record = fromApi(await res.json());
  added = [...added, record];
  publish();
  return record;
}

export async function deleteBmp(record: BmpRecord) {
  if (!record.added) throw new Error('BMPs from the GIS data can only be changed in the geodatabase');
  const res = await apiFetch(`/bmps/${record.added.id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(await detail(res, 'Could not delete the BMP'));
  added = added.filter(r => r !== record);
  publish();
}
