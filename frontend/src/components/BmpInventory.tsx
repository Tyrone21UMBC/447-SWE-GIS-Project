import { useState } from "react";
import type { CSSProperties } from "react";
import { NavLink } from "react-router";
import { Droplets } from "lucide-react";
import { BMP_RECORDS } from "../data/bmps.ts";

// BMP counts per facility type, largest first
const FACILITY_TYPES = Object.entries(
  BMP_RECORDS.reduce<Record<string, number>>((counts, r) => {
    const type = r.facilityType ?? "Unknown";
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {})
).sort((a, b) => b[1] - a[1]);
const TOP_TYPES = 6;
const NO_SERVICE_DATE = BMP_RECORDS.filter(r => !/^\d{4}-\d{2}-\d{2}$/.test(r.mdeClosure ?? "")).length;

// Admin dashboard card summarizing the BMPs in the GIS data
export default function BmpInventory() {
  const [showAllTypes, setShowAllTypes] = useState(false);
  return (
    <section style={inventoryStyles.card}>
      <h2 style={inventoryStyles.cardTitle}><Droplets size={20} /> BMP inventory</h2>
      <p style={inventoryStyles.bigNumber}>{BMP_RECORDS.length}</p>
      <p style={inventoryStyles.muted}>BMPs in the GIS data, across {FACILITY_TYPES.length} facility types</p>
      <ul style={inventoryStyles.bars}>
        {(showAllTypes ? FACILITY_TYPES : FACILITY_TYPES.slice(0, TOP_TYPES)).map(([type, n]) => (
          <li key={type} style={inventoryStyles.barRow}>
            <span style={inventoryStyles.barLabel}>
              <span>{type}</span>
              <span style={{ fontWeight: 600 }}>{n}</span>
            </span>
            <span style={inventoryStyles.barTrack}>
              <span style={{ ...inventoryStyles.barFill, width: `${(n / FACILITY_TYPES[0][1]) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {FACILITY_TYPES.length > TOP_TYPES && (
        <button style={inventoryStyles.linkButton} onClick={() => setShowAllTypes(!showAllTypes)}>
          {showAllTypes ? "Show fewer" : `Show all ${FACILITY_TYPES.length} types`}
        </button>
      )}
      {NO_SERVICE_DATE > 0 && (
        <p style={{ ...inventoryStyles.notice, ...inventoryStyles.noticeWarn }}>
          {NO_SERVICE_DATE} BMPs have no in-service date in the master list, so checklists for them start with that field blank.
        </p>
      )}
      <NavLink to="/" style={inventoryStyles.button}>Open the map</NavLink>
    </section>
  );
}

const inventoryStyles: Record<string, CSSProperties> = {
  card: {
    flex: "1 1 280px",
    boxSizing: "border-box",
    minWidth: 0,
    backgroundColor: "#fff",
    borderRadius: "12px",
    borderTop: "4px solid #f7cc0d",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    padding: "20px 24px",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
    fontSize: "19px",
  },
  muted: {
    margin: "10px 0",
    color: "#4b5563",
    fontSize: "14px",
  },
  notice: {
    margin: "10px 0",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  noticeWarn: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  bigNumber: {
    margin: "12px 0 0",
    fontSize: "40px",
    fontWeight: 700,
  },
  bars: {
    listStyle: "none",
    padding: 0,
    margin: "16px 0",
    display: "grid",
    gap: "10px",
  },
  barRow: {
    display: "grid",
    gap: "4px",
  },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  barTrack: {
    height: "8px",
    borderRadius: "9999px",
    backgroundColor: "#f3f4f6",
  },
  barFill: {
    display: "block",
    height: "100%",
    borderRadius: "9999px",
    backgroundColor: "#f7cc0d",
  },
  linkButton: {
    padding: 0,
    border: "none",
    background: "none",
    color: "#0070af",
    font: "inherit",
    fontSize: "14px",
    textDecoration: "underline",
    cursor: "pointer",
  },
  button: {
    display: "inline-block",
    marginTop: "6px",
    padding: "10px 20px",
    borderRadius: "10px",
    backgroundColor: "#000",
    color: "#f7cc0d",
    fontWeight: 600,
    textDecoration: "none",
  },
};
