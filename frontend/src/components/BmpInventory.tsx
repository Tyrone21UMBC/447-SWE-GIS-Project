import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { NavLink } from "react-router";
import { Droplets, Plus, Trash2, MapPin } from "lucide-react";
import { deleteBmp, useBmps, type BmpRecord } from "../data/bmps.ts";
import AddBmpModal from "./AddBmpModal.tsx";

const TOP_TYPES = 6;
const hasServiceDate = (r: BmpRecord) => /^\d{4}-\d{2}-\d{2}$/.test(r.mdeClosure ?? "");
const mapLink = (r: BmpRecord) => `/?bmp=${encodeURIComponent(r.trackingNumber)}`;

// Admin dashboard card summarizing the BMPs, where admins can also add new ones
export default function BmpInventory() {
  const { records } = useBmps();
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string; record?: BmpRecord } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // BMP counts per facility type, largest first
  const facilityTypes = useMemo(() => Object.entries(
    records.reduce<Record<string, number>>((counts, r) => {
      const type = r.facilityType ?? "Unknown";
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1]), [records]);
  const noServiceDate = records.filter(r => !hasServiceDate(r)).length;
  const added = records.filter(r => r.added);

  async function remove(record: BmpRecord) {
    if (!window.confirm(`Delete ${record.name ?? record.trackingNumber} (${record.trackingNumber})? It will disappear from the map.`)) return;
    setDeletingId(record.added!.id);
    setNotice(null);
    try {
      await deleteBmp(record);
      setNotice({ ok: true, text: `Deleted ${record.trackingNumber}.` });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof TypeError ? "Could not reach the server" : err instanceof Error ? err.message : "Could not delete the BMP" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section style={inventoryStyles.card}>
      <div style={inventoryStyles.cardHeader}>
        <h2 style={inventoryStyles.cardTitle}><Droplets size={20} /> BMP inventory</h2>
        <button style={inventoryStyles.addButton} onClick={() => { setNotice(null); setAdding(true); }}>
          <Plus size={16} /> Add BMP
        </button>
      </div>
      <p style={inventoryStyles.bigNumber}>{records.length}</p>
      <p style={inventoryStyles.muted}>
        BMPs on the map, across {facilityTypes.length} facility types
        {added.length > 0 && ` (${added.length} added in the app)`}
      </p>

      {notice && (
        <p role="status" style={{ ...inventoryStyles.notice, ...(notice.ok ? inventoryStyles.noticeOk : inventoryStyles.noticeError) }}>
          {notice.text}
          {notice.record && <> <NavLink to={mapLink(notice.record)} style={inventoryStyles.inlineLink}>View on map</NavLink></>}
        </p>
      )}

      <ul style={inventoryStyles.bars}>
        {(showAllTypes ? facilityTypes : facilityTypes.slice(0, TOP_TYPES)).map(([type, n]) => (
          <li key={type} style={inventoryStyles.barRow}>
            <span style={inventoryStyles.barLabel}>
              <span>{type}</span>
              <span style={{ fontWeight: 600 }}>{n}</span>
            </span>
            <span style={inventoryStyles.barTrack}>
              <span style={{ ...inventoryStyles.barFill, width: `${(n / facilityTypes[0][1]) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {facilityTypes.length > TOP_TYPES && (
        <button style={inventoryStyles.linkButton} onClick={() => setShowAllTypes(!showAllTypes)}>
          {showAllTypes ? "Show fewer" : `Show all ${facilityTypes.length} types`}
        </button>
      )}

      {added.length > 0 && (
        <>
          <h3 style={inventoryStyles.subTitle}>Added in the app</h3>
          <ul style={inventoryStyles.addedList}>
            {added.map(r => (
              <li key={r.trackingNumber} style={inventoryStyles.addedRow}>
                <span style={{ minWidth: 0 }}>
                  <strong>{r.name}</strong>
                  <span style={inventoryStyles.addedMeta}>
                    {r.trackingNumber} · {r.facilityType}
                    {r.added!.by && ` · by ${r.added!.by}`}
                  </span>
                </span>
                <span style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <NavLink to={mapLink(r)} style={inventoryStyles.iconButton} aria-label={`Show ${r.trackingNumber} on the map`} title="Show on map">
                    <MapPin size={16} />
                  </NavLink>
                  <button style={inventoryStyles.iconButton} onClick={() => remove(r)} disabled={deletingId !== null}
                    aria-label={`Delete ${r.trackingNumber}`} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {noServiceDate > 0 && (
        <p style={{ ...inventoryStyles.notice, ...inventoryStyles.noticeWarn }}>
          {noServiceDate} BMPs have no in-service date, so checklists for them start with that field blank.
        </p>
      )}
      <NavLink to="/" style={inventoryStyles.button}>Open the map</NavLink>

      {adding && (
        <AddBmpModal
          records={records}
          onClose={() => setAdding(false)}
          onAdded={record => {
            setAdding(false);
            setNotice({ ok: true, text: `Added ${record.name} (${record.trackingNumber}).`, record });
          }}
        />
      )}
    </section>
  );
}

const inventoryStyles: Record<string, CSSProperties> = {
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  addButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "7px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#000",
    color: "#f7cc0d",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  noticeOk: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  noticeError: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  inlineLink: {
    color: "inherit",
    fontWeight: 600,
  },
  subTitle: {
    margin: "18px 0 6px",
    fontSize: "15px",
  },
  addedList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 12px",
  },
  addedRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
  },
  addedMeta: {
    display: "block",
    color: "#6b7280",
    fontSize: "13px",
  },
  iconButton: {
    display: "flex",
    padding: "6px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
    color: "#111827",
    cursor: "pointer",
  },
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
