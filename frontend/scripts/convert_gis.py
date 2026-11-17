"""Convert the BMPs in UMBC's SWM Tracking geodatabase into src/data/bmps.json.

The geodatabase is the source of truth: it decides which BMPs exist, where they
are, and every detail it records. The BMP Facilities Master List may be out of
date, so it only fills in what the geodatabase has no field for (the BMP name
and the MDE closure date).

Run from the frontend folder whenever the geodatabase changes:
    python3 scripts/convert_gis.py "path/to/UMBC SWM Tracking.gdb" \
        --master "path/to/BMP Facilities Master List.xlsx"

The geodatabase needs GDAL's ogr2ogr on the PATH. The spreadsheet is read with
the standard library (an .xlsx file is a zip of XML files).
"""
import argparse
import datetime
import json
import math
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "bmps.json"

# Geodatabase field -> JSON key. Fields not listed here are dropped.
GDB_FIELDS = {
    "SWM_Tracking_Number": "trackingNumber",
    "MDE_SF_Num": "sfNumber",
    "UMBC_PRF": "prfNumber",
    "Facility_T": "facilityType",
    "Outfall_Po": "outfallPoint",
    "Drainage_1": "drainageArea",
    "Drainage_A": "drainageAreaSf",
    "ESDv__CF_": "esdv",
}
# Master list columns used only where the geodatabase has no equivalent
MASTER_COLUMNS = {
    "SWM Tracking Number": "trackingNumber",
    "BMP Name": "name",
    "MDE Closure": "mdeClosure",
    "Longitude, Latitude": "latlong",  # values are actually "lat, long"
}
# Geodatabase tracking numbers written differently in the master list.
# Each pair was confirmed by facility type and location (2-45 m apart).
MASTER_ALIASES = {
    "14-SF-2010-01": "14-SF-2010-01A",
    "15-SF-0180-16": "15-SF-0180-GR",   # Event Center green roof
    "15-SF-0180-17": "15-SF-0180-NR",   # Event Center NRD sidewalk
    "16-SF-0148-07": "16-SF-0148-NR2",  # ILSB NRD sidewalk W
    "16-SF-0148-08": "16-SF-0148-NR1",  # ILSB NRD sidewalk E
    "21-SF-0042-1A": "21-SF-0042-WS1A",
    "21-SF-0042-1B": "21-SF-0042-WS1B",
    "21-SF-0042-1C": "21-SF-0042-WS1C",
    "13-SF-0142-04": "13-SF-0142-00",   # Library Pond (reconstruction permit)
}
EMPTY = {"", "-", "N/A"}


def read_gdb_bmps(gdb):
    """Return the BMP_Database features as GeoJSON in WGS84 (lon, lat)."""
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "bmps.geojson"
        subprocess.run(["ogr2ogr", "-f", "GeoJSON", "-t_srs", "EPSG:4326",
                        "-lco", "COORDINATE_PRECISION=6", str(out), str(gdb), "BMP_Database"],
                       check=True)
        return json.loads(out.read_text())["features"]


def clockwise_rings(geometry):
    """Rings of [lon, lat], wound clockwise as ArcGIS expects for outer rings
    (the BMP polygons have no holes)."""
    rings = []
    for polygon in geometry["coordinates"]:
        for ring in polygon:
            # Shoelace sum is positive for clockwise rings
            cw = sum((x2 - x1) * (y2 + y1) for (x1, y1), (x2, y2) in zip(ring, ring[1:])) > 0
            rings.append(ring if cw else ring[::-1])
    return rings


def ring_center(rings):
    pts = [p for ring in rings for p in ring]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def read_master_rows(path):
    z = zipfile.ZipFile(path)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.iter(f"{{{NS['m']}}}row"):
        cells = {}
        for c in row.findall("m:c", NS):
            v, ref = c.find("m:v", NS), c.get("r")
            if v is None or v.text is None or ref is None:
                continue
            col = 0
            for ch in re.match(r"[A-Z]+", ref).group():
                col = col * 26 + ord(ch) - 64
            cells[col - 1] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows.append(cells)

    header_idx = next(i for i, r in enumerate(rows) if "SWM Tracking Number" in r.values())
    headers = {col: re.sub(r"\s+", " ", name).strip() for col, name in rows[header_idx].items()}
    for cells in rows[header_idx + 1:]:
        rec = {MASTER_COLUMNS[headers[c]]: v.strip() for c, v in cells.items()
               if headers.get(c) in MASTER_COLUMNS and v.strip() not in EMPTY}
        if rec.get("trackingNumber"):
            yield rec


def excel_date(value):
    """Excel stores dates as days since 1899-12-30; leave text like 'No' or 'Yes' as-is."""
    if re.fullmatch(r"\d{5}(\.0+)?", value):
        return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(value)))).isoformat()
    return value


def parse_latlong(value):
    # Tolerates a decimal comma typo such as "39.25214, -76,7147"
    m = re.fullmatch(r"\s*(-?\d+\.\d+)\s*,\s*(-?\d+)[.,](\d+)\s*", value or "")
    return (float(m[1]), float(f"{m[2]}.{m[3]}")) if m else None


def add_master_details(records, master_rows):
    """Copy the name and MDE closure date from the master list. When several master
    rows share a tracking number, use the row whose point is closest to the outline."""
    by_tracking = {}
    for row in master_rows:
        by_tracking.setdefault(row["trackingNumber"], []).append(row)

    unmatched, used = [], set()
    for rec in records:
        candidates = by_tracking.get(MASTER_ALIASES.get(rec["trackingNumber"], rec["trackingNumber"]))
        if not candidates:
            unmatched.append(rec["trackingNumber"])
            continue

        def distance(row):
            latlon = parse_latlong(row.get("latlong"))
            return math.inf if not latlon else (latlon[0] - rec["lat"]) ** 2 + (latlon[1] - rec["lon"]) ** 2

        row = min(candidates, key=distance)
        used.add(id(row))
        if row.get("name"):
            rec["name"] = row["name"]
        if row.get("mdeClosure"):
            rec["mdeClosure"] = excel_date(row["mdeClosure"])

    master_only = [f"{row['trackingNumber']} {row.get('name', '')}".strip()
                   for rows in by_tracking.values() for row in rows if id(row) not in used]
    return unmatched, master_only


def main(gdb, master=None):
    records = []
    for f in read_gdb_bmps(gdb):
        props = f["properties"]
        rec = {}
        for field, key in GDB_FIELDS.items():
            value = props.get(field)
            if isinstance(value, str):
                value = value.strip()
                if value in EMPTY:
                    continue
            if value is not None:
                rec[key] = value
        if not rec.get("trackingNumber"):
            continue
        rec["shape"] = clockwise_rings(f["geometry"])
        lon, lat = ring_center(rec["shape"])
        rec["lat"], rec["lon"] = round(lat, 6), round(lon, 6)
        records.append(rec)

    numbers = [r["trackingNumber"] for r in records]
    dupes = sorted({n for n in numbers if numbers.count(n) > 1})
    if dupes:
        raise SystemExit(f"Duplicate SWM Tracking Numbers in the geodatabase: {dupes}")
    records.sort(key=lambda r: r["trackingNumber"])

    unmatched, master_only = add_master_details(records, read_master_rows(master)) if master else ([], [])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    # One record per line keeps diffs readable despite the outline coordinates
    OUT.write_text("[\n" + ",\n".join(json.dumps(r, separators=(",", ":")) for r in records) + "\n]\n")
    print(f"Wrote {len(records)} BMPs from the geodatabase to {OUT}")
    if master:
        print(f"  with a name from the master list: {sum('name' in r for r in records)}")
        print(f"  not in the master list: {unmatched}")
        print(f"  in the master list but not the geodatabase (left out): {master_only}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("gdb", help="UMBC SWM Tracking .gdb folder")
    parser.add_argument("--master", help="BMP Facilities Master List .xlsx (adds names and MDE closure dates)")
    args = parser.parse_args()
    main(args.gdb, args.master)
