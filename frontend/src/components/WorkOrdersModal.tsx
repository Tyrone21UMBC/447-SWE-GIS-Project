import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { X, ExternalLink } from "lucide-react";

export type WorkOrderStatus = "pending" | "in_progress" | "completed";
export type WorkOrder = {
  id: number;
  bmp_id: string | null;
  bmp_name: string | null;
  filename: string;
  drive_url: string;
  status: WorkOrderStatus;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
};
export type WorkOrderTab = "recent" | "active" | "completed";

export const STATUSES: WorkOrderStatus[] = ["pending", "in_progress", "completed"];
export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: "Pending", in_progress: "In progress", completed: "Completed",
};
const STATUS_COLORS: Record<WorkOrderStatus, CSSProperties> = {
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  in_progress: { backgroundColor: "#dbeafe", color: "#1e40af" },
  completed: { backgroundColor: "#dcfce7", color: "#166534" },
};

const RECENT_DAYS = 30;
const TABS: { id: WorkOrderTab; label: string; matches: (o: WorkOrder) => boolean }[] = [
  { id: "recent", label: "Recent", matches: o => Date.now() - Date.parse(o.created_at) < RECENT_DAYS * 864e5 },
  { id: "active", label: "Active", matches: o => o.status !== "completed" },
  { id: "completed", label: "Completed", matches: o => o.status === "completed" },
];
const EMPTY: Record<WorkOrderTab, string> = {
  recent: `No reports were submitted in the last ${RECENT_DAYS} days.`,
  active: "No open work orders.",
  completed: "No completed work orders yet.",
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function StatusPill({ status }: { status: WorkOrderStatus }) {
  return <span style={{ ...modalStyles.pill, ...STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>;
}

type Props = {
  orders: WorkOrder[];
  initialTab: WorkOrderTab;
  onClose: () => void;
  onStatusChange: (order: WorkOrder, status: WorkOrderStatus) => Promise<void>;
};

export default function WorkOrdersModal({ orders, initialTab, onClose, onStatusChange }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Escape closes; the page behind doesn't scroll while the modal is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function changeStatus(order: WorkOrder, status: WorkOrderStatus) {
    setSavingId(order.id);
    setError(null);
    try {
      await onStatusChange(order, status);
    } catch (err) {
      setError(err instanceof TypeError ? "Could not reach the server" : err instanceof Error ? err.message : "Could not change the status");
    } finally {
      setSavingId(null);
    }
  }

  const current = TABS.find(t => t.id === tab)!;
  const shown = orders.filter(current.matches);

  return (
    <div style={modalStyles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="work-orders-title" tabIndex={-1} style={modalStyles.dialog}>
        <div style={modalStyles.header}>
          <h2 id="work-orders-title" style={modalStyles.title}>Work orders</h2>
          <button onClick={onClose} style={modalStyles.close} aria-label="Close"><X size={22} /></button>
        </div>

        <div role="tablist" style={modalStyles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              style={{ ...modalStyles.tab, ...(tab === t.id ? modalStyles.tabActive : {}) }}
            >
              {t.label}
              <span style={modalStyles.tabCount}>{orders.filter(t.matches).length}</span>
            </button>
          ))}
        </div>
        <p style={modalStyles.hint}>
          {tab === "recent" ? `Reports submitted in the last ${RECENT_DAYS} days, newest first.`
            : tab === "active" ? "Pending and in-progress work orders. Set the status as work moves along."
            : "Work orders that have been closed out."}
        </p>
        {error && <p role="alert" style={modalStyles.error}>{error}</p>}

        <div style={modalStyles.body}>
          {shown.length === 0 ? (
            <p style={modalStyles.empty}>{EMPTY[tab]}</p>
          ) : (
            <table style={modalStyles.table}>
              <thead>
                <tr>
                  <th style={modalStyles.th}>BMP</th>
                  <th style={modalStyles.th}>Submitted</th>
                  <th style={{ ...modalStyles.th, width: "150px" }}>Status</th>
                  <th style={{ ...modalStyles.th, width: "90px" }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(o => (
                  <tr key={o.id}>
                    <td style={modalStyles.td}>
                      <div style={{ fontWeight: 600 }}>{o.bmp_name ?? o.bmp_id ?? "No BMP selected"}</div>
                      <div style={modalStyles.sub}>#{o.id}{o.bmp_name && o.bmp_id ? ` · ${o.bmp_id}` : ""}</div>
                    </td>
                    <td style={modalStyles.td}>
                      <div>{formatDate(o.created_at)}</div>
                      <div style={modalStyles.sub}>by {o.submitted_by ?? "deleted user"}</div>
                    </td>
                    <td style={modalStyles.td}>
                      <select
                        value={o.status}
                        disabled={savingId !== null}
                        onChange={e => changeStatus(o, e.target.value as WorkOrderStatus)}
                        style={{ ...modalStyles.select, ...STATUS_COLORS[o.status] }}
                        aria-label={`Status of work order ${o.id}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td style={modalStyles.td}>
                      <a href={o.drive_url} target="_blank" rel="noreferrer" style={modalStyles.link}>
                        PDF <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const modalStyles: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 10001,                  // above the header
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    color: "#111827",
  },
  dialog: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "920px",
    maxHeight: "calc(100vh - 32px)",
    borderRadius: "12px",
    borderTop: "4px solid #f7cc0d",
    backgroundColor: "#fff",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    outline: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px 8px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
  },
  close: {
    display: "flex",
    padding: "6px",
    border: "none",
    borderRadius: "8px",
    background: "none",
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    padding: "0 24px",
    borderBottom: "1px solid #e5e7eb",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 6px",
    marginBottom: "-1px",
    border: "none",
    borderBottom: "3px solid transparent",
    background: "none",
    color: "#4b5563",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabActive: {
    borderBottomColor: "#f7cc0d",
    color: "#000",
  },
  tabCount: {
    padding: "1px 8px",
    borderRadius: "9999px",
    backgroundColor: "#f3f4f6",
    fontSize: "13px",
  },
  hint: {
    margin: "12px 24px 4px",
    color: "#4b5563",
    fontSize: "14px",
  },
  error: {
    margin: "8px 24px 0",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "14px",
  },
  body: {
    overflow: "auto",
    padding: "4px 24px 20px",
  },
  empty: {
    padding: "32px 0",
    textAlign: "center",
    color: "#6b7280",
  },
  table: {
    width: "100%",
    minWidth: "560px",
    borderCollapse: "collapse",
    fontSize: "15px",
  },
  th: {
    position: "sticky",
    top: 0,
    padding: "10px 8px",
    borderBottom: "2px solid #e5e7eb",
    backgroundColor: "#fff",
    color: "#4b5563",
    fontSize: "13px",
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
  },
  sub: {
    color: "#6b7280",
    fontSize: "13px",
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid transparent",
    borderRadius: "8px",
    font: "inherit",
    fontWeight: 600,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#0070af",
    fontWeight: 600,
  },
  pill: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
};
