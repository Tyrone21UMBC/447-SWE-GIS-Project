"""Convert the BMP Facilities Master List (.xlsx) into src/data/bmpMaster.json,
attaching each BMP's outline from UMBC's SWM Tracking geodatabase.

Run from the frontend folder whenever the spreadsheet or geodatabase changes:
    python3 scripts/convert_master_list.py "path/to/BMP Facilities Master List.xlsx" \
        --gdb "path/to/UMBC SWM Tracking.gdb"

The spreadsheet is read with the standard library (an .xlsx file is a zip of
XML files). The geodatabase needs GDAL's ogr2ogr on the PATH.
"""
import argparse
import datetime
import json
import math
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "bmpMaster.json"

# Spreadsheet header -> JSON key. Columns not listed here are dropped.
COLUMNS = {
    "UMBC BMP Sequence Number": "id",
    "SWM Tracking Number": "trackingNumber",
    "MDE SF Number": "sfNumber",
    "MS4 BMP ID": "ms4Id",
    "BMP Name": "name",
    "Project Name": "projectName",
    "Facility Type": "facilityType",
    "Outfall Point": "outfallPoint",
    "Drainage Area": "drainageArea",
    "UMBC PRF Number": "prfNumber",
    "New or Redevelopment": "newOrRedevelopment",
    "MDE ESD Designation": "esdDesignation",
    "MS4 BMP Class/Type": "bmpClassType",
    "SWM Report": "swmReport",
    "SWM Permit": "swmPermit",
    "MDE Closure": "mdeClosure",
    "Drainage Area (SF)": "drainageAreaSf",
    "ESDv (CF) / WQv (CF)": "esdv",
    "Longitude, Latitude": "_latlong",  # values are actually "lat, long"
    "MD North Meters": "_mdNorth",
    "MD East Meters": "_mdEast",
}
# Geodatabase tracking numbers written differently in the master list.
# Each pair was confirmed by facility type and location (2-45 m apart).
GDB_ALIASES = {
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
DATE_KEYS = {"swmReport", "swmPermit", "mdeClosure"}
NUMBER_KEYS = {"drainageAreaSf", "esdv"}
EMPTY = {"", "-", "N/A"}


def read_rows(path):
    z = zipfile.ZipFile(path)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
    ]
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    for row in sheet.iter(f"{{{NS['m']}}}row"):
        cells = {}
        for c in row.findall("m:c", NS):
            v, ref = c.find("m:v", NS), c.get("r")
            if v is None or v.text is None or ref is None:
                continue
            letters = re.match(r"[A-Z]+", ref).group()
            col = 0
            for ch in letters:
                col = col * 26 + ord(ch) - 64
            cells[col - 1] = shared[int(v.text)] if c.get("t") == "s" else v.text
        yield cells


def excel_date(value):
    """Excel stores dates as days since 1899-12-30; leave text like 'No' or 'Mod #1' as-is."""
    if re.fullmatch(r"\d{5}(\.0+)?", value):
        return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(value)))).isoformat()
    return value


def md_state_plane_to_latlon(north, east):
    """Inverse Lambert Conformal Conic for NAD83 / Maryland (meters), EPSG:26985."""
    a, f = 6378137.0, 1 / 298.257222101
    e = math.sqrt(2 * f - f * f)
    phi1, phi2, phi0 = map(math.radians, (39.45, 38.3, 37 + 40 / 60))
    lam0, fe, fn = math.radians(-77), 400000.0, 0.0

    def m(p):
        return math.cos(p) / math.sqrt(1 - (e * math.sin(p)) ** 2)

    def t(p):
        return math.tan(math.pi / 4 - p / 2) / ((1 - e * math.sin(p)) / (1 + e * math.sin(p))) ** (e / 2)

    n = (math.log(m(phi1)) - math.log(m(phi2))) / (math.log(t(phi1)) - math.log(t(phi2)))
    F = m(phi1) / (n * t(phi1) ** n)
    rho0 = a * F * t(phi0) ** n
    x, y = east - fe, rho0 - (north - fn)
    rho = math.copysign(math.hypot(x, y), n)
    tp = (rho / (a * F)) ** (1 / n)
    lon = math.atan2(x, y) / n + lam0
    lat = math.pi / 2 - 2 * math.atan(tp)
    for _ in range(10):
        lat = math.pi / 2 - 2 * math.atan(tp * ((1 - e * math.sin(lat)) / (1 + e * math.sin(lat))) ** (e / 2))
    return math.degrees(lat), math.degrees(lon)


def parse_latlong(value):
    # Tolerates a decimal comma typo such as "39.25214, -76,7147"
    m = re.fullmatch(r"\s*(-?\d+\.\d+)\s*,\s*(-?\d+)[.,](\d+)\s*", value or "")
    return (float(m[1]), float(f"{m[2]}.{m[3]}")) if m else None


def read_gdb_shapes(gdb):
    """Return {master tracking number: [rings]} from the geodatabase's BMP_Database layer.

    Rings are [lon, lat] lists, wound clockwise as ArcGIS expects for outer rings
    (the BMP polygons have no holes).
    """
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "bmps.geojson"
        subprocess.run(["ogr2ogr", "-f", "GeoJSON", "-t_srs", "EPSG:4326",
                        "-lco", "COORDINATE_PRECISION=6", str(out), str(gdb), "BMP_Database"],
                       check=True)
        features = json.loads(out.read_text())["features"]

    shapes = {}
    for f in features:
        tracking = (f["properties"].get("SWM_Tracking_Number") or "").strip()
        rings = []
        for polygon in f["geometry"]["coordinates"]:
            for ring in polygon:
                # Shoelace sum is positive for clockwise rings
                cw = sum((x2 - x1) * (y2 + y1) for (x1, y1), (x2, y2) in zip(ring, ring[1:])) > 0
                rings.append(ring if cw else ring[::-1])
        shapes[GDB_ALIASES.get(tracking, tracking)] = rings
    return shapes


def ring_center(rings):
    pts = [p for ring in rings for p in ring]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def attach_shapes(records, shapes):
    """Give each geodatabase outline to its master record. When several master rows
    share a tracking number, the outline goes to the row whose point is closest."""
    by_tracking = {}
    for rec in records:
        rec["shape"] = None
        by_tracking.setdefault(rec["trackingNumber"], []).append(rec)

    unmatched = []
    for tracking, rings in shapes.items():
        candidates = by_tracking.get(tracking)
        if not candidates:
            unmatched.append(tracking)
            continue
        lon, lat = ring_center(rings)
        rec = min(candidates, key=lambda r: math.inf if r["lat"] is None
                  else (r["lat"] - lat) ** 2 + (r["lon"] - lon) ** 2)
        rec["shape"] = rings
        if rec["lat"] is None:
            rec["lat"], rec["lon"], rec["coordSource"] = round(lat, 6), round(lon, 6), "gdb"
    return unmatched


def main(path, gdb=None):
    rows = list(read_rows(path))
    header_idx = next(i for i, r in enumerate(rows) if "SWM Tracking Number" in r.values())
    headers = {col: re.sub(r"\s+", " ", name).strip() for col, name in rows[header_idx].items()}

    records, skipped = [], []
    for cells in rows[header_idx + 1:]:
        raw = {COLUMNS[headers[c]]: v.strip() for c, v in cells.items()
               if headers.get(c) in COLUMNS and v.strip() not in EMPTY}
        if not raw.get("trackingNumber"):
            continue
        if not raw.get("id"):
            skipped.append(raw["trackingNumber"])
            continue

        rec = {k: v for k, v in raw.items() if not k.startswith("_")}
        for k in DATE_KEYS & rec.keys():
            rec[k] = excel_date(rec[k])
        for k in NUMBER_KEYS & rec.keys():
            # Some cells hold text such as "383.5-Ac"; keep those as written
            if re.fullmatch(r"-?\d+(\.\d+)?", rec[k]):
                rec[k] = round(float(rec[k]), 1)

        latlon = parse_latlong(raw.get("_latlong"))
        source = "latlong" if latlon else None
        if not latlon and raw.get("_mdNorth") and raw.get("_mdEast"):
            latlon = md_state_plane_to_latlon(float(raw["_mdNorth"]), float(raw["_mdEast"]))
            source = "stateplane"
        rec["lat"], rec["lon"] = (round(latlon[0], 6), round(latlon[1], 6)) if latlon else (None, None)
        rec["coordSource"] = source
        records.append(rec)

    ids = [r["id"] for r in records]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        sys.exit(f"Duplicate UMBC BMP Sequence Numbers: {sorted(dupes)}")

    unmatched = attach_shapes(records, read_gdb_shapes(gdb)) if gdb else []
    if not gdb:
        for rec in records:
            rec["shape"] = None

    OUT.parent.mkdir(parents=True, exist_ok=True)
    # One record per line keeps diffs readable despite the outline coordinates
    OUT.write_text("[\n" + ",\n".join(json.dumps(r, separators=(",", ":")) for r in records) + "\n]\n")
    no_coords = [r["trackingNumber"] for r in records if r["lat"] is None]
    print(f"Wrote {len(records)} BMPs to {OUT}")
    print(f"  with geodatabase outline: {sum(r['shape'] is not None for r in records)}")
    print(f"  geodatabase outlines with no master record: {unmatched}")
    print(f"  points from state plane: {sum(r['coordSource'] == 'stateplane' for r in records)}")
    print(f"  no coordinates or outline (not shown on map): {len(no_coords)} {no_coords}")
    print(f"  skipped, no sequence number: {skipped}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("master_list", help="BMP Facilities Master List .xlsx")
    parser.add_argument("--gdb", help="UMBC SWM Tracking .gdb folder (adds BMP outlines)")
    args = parser.parse_args()
    main(args.master_list, args.gdb)
