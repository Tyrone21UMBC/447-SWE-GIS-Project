// BMP records from the BMP Facilities Master List.
// bmpMaster.json is generated: after editing the spreadsheet or geodatabase, rerun
//   python3 scripts/convert_master_list.py "<master list .xlsx>" --gdb "<UMBC SWM Tracking.gdb>"
import records from './bmpMaster.json';

export type BmpRecord = {
  id: string;                  // UMBC BMP Sequence Number (unique)
  trackingNumber: string;      // SWM Tracking Number, e.g. "11-SF-0048-02" (not unique)
  sfNumber?: string;           // MDE SF Number (the plan number)
  ms4Id?: string;
  name?: string;
  projectName?: string;
  facilityType?: string;
  outfallPoint?: string;
  drainageArea?: string;
  prfNumber?: string;
  newOrRedevelopment?: string;
  esdDesignation?: string;
  bmpClassType?: string;
  swmReport?: string;          // ISO date, or text such as "No"
  swmPermit?: string;          // ISO date, or text such as "Mod #1"
  mdeClosure?: string;         // ISO date, or text such as "No"
  drainageAreaSf?: number | string;
  esdv?: number | string;
  lat: number | null;
  lon: number | null;
  coordSource: 'latlong' | 'stateplane' | 'gdb' | null;
  shape: number[][][] | null;  // outline rings of [lon, lat] from the SWM Tracking geodatabase
};

export const BMP_RECORDS = records as BmpRecord[];

const BMPS_BY_ID = new Map(BMP_RECORDS.map(r => [r.id, r]));

export function getBmp(id: string | undefined): BmpRecord | null {
  return id ? BMPS_BY_ID.get(id.trim()) ?? null : null;
}
