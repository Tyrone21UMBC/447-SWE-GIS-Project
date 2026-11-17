// BMPs from UMBC's SWM Tracking geodatabase (the source of truth).
// bmps.json is generated: after the geodatabase changes, rerun
//   python3 scripts/convert_gis.py "<UMBC SWM Tracking.gdb>" --master "<master list .xlsx>"
import records from './bmps.json';

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
};

export const BMP_RECORDS = records as BmpRecord[];

const BMPS_BY_TRACKING_NUMBER = new Map(BMP_RECORDS.map(r => [r.trackingNumber, r]));

export function getBmp(trackingNumber: string | undefined): BmpRecord | null {
  return trackingNumber ? BMPS_BY_TRACKING_NUMBER.get(trackingNumber.trim()) ?? null : null;
}
