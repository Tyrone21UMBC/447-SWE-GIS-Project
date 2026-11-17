import Header from "../components/Header.tsx";
import BmpInventory from "../components/BmpInventory.tsx";
import WorkOrdersModal, { StatusPill, formatDate, type WorkOrder, type WorkOrderStatus, type WorkOrderTab } from "../components/WorkOrdersModal.tsx";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { FileText, Clock, Wrench, SquareCheckBig, ClipboardList, Search, type LucideIcon } from "lucide-react";
import { apiFetch, toRole, type Role } from "../auth.ts";

type User = { id: number; username: string; email: string; role: Role };

const ROLES: Role[] = ["admin", "staff", "visitor"];
const ROLE_LABELS: Record<Role, string> = { admin: "Admin", staff: "Staff", visitor: "Visitor" };
const ROLE_PLURALS: Record<Role, string> = { admin: "Admins", staff: "Staff", visitor: "Visitors" };

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof TypeError ? "Could not reach the server" : err instanceof Error ? err.message : fallback;

function Admin() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [orders, setOrders] = useState<WorkOrder[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<WorkOrderTab | null>(null);
  const closeModal = useCallback(() => setModalTab(null), []);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, meRes] = await Promise.all([apiFetch("/users"), apiFetch("/users/me")]);
        if (!usersRes.ok) throw new Error(usersRes.status === 403 ? "Only admins can see the user list." : "Could not load users.");
        const list: User[] = await usersRes.json();
        setUsers(list.map(u => ({ ...u, role: toRole(u.role) })).sort((a, b) => a.username.localeCompare(b.username)));
        if (meRes.ok) setMyId((await meRes.json()).id);
      } catch (err) {
        setLoadError(errorMessage(err, "Could not load users."));
      }
    })();
    (async () => {
      try {
        const res = await apiFetch("/work-orders");
        if (!res.ok) throw new Error("Could not load work orders.");
        setOrders(await res.json());
      } catch (err) {
        setOrdersError(errorMessage(err, "Could not load work orders."));
      }
    })();
  }, []);

  // Errors are shown by the modal
  async function changeStatus(order: WorkOrder, status: WorkOrderStatus) {
    const res = await apiFetch(`/work-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "Could not change the status");
    setOrders(list => list && list.map(o => (o.id === order.id ? body : o)));
  }

  async function changeRole(user: User, role: Role) {
    if (!window.confirm(`Change ${user.username} from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[role]}?`)) return;
    setSavingId(user.id);
    setNotice(null);
    try {
      const res = await apiFetch(`/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "Could not change the role");
      setUsers(list => list && list.map(u => (u.id === user.id ? { ...u, role: toRole(body.role) } : u)));
      setNotice({ ok: true, text: `${user.username} is now ${ROLE_LABELS[toRole(body.role)]}.` });
    } catch (err) {
      setNotice({ ok: false, text: errorMessage(err, "Could not change the role") });
    } finally {
      setSavingId(null);
    }
  }

  const count = (role: Role) => users?.filter(u => u.role === role).length ?? "–";
  const q = query.trim().toLowerCase();
  const shown = (users ?? []).filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));

  const countOrders = (status?: WorkOrderStatus) => orders?.filter(o => !status || o.status === status).length ?? "–";
  const tile = (label: string, value: number | string, Icon: LucideIcon, tab: WorkOrderTab) => (
    <button key={label} style={adminStyles.tile} onClick={() => setModalTab(tab)} disabled={!orders} title={`Open ${tab} work orders`}>
      <Icon size={22} />
      <span style={adminStyles.tileValue}>{value}</span>
      <span style={adminStyles.tileLabel}>{label}</span>
    </button>
  );
  const chip = (label: string, value: number | string, role: Role | null) => (
    <button
      key={label}
      style={{ ...adminStyles.chip, ...(roleFilter === role ? adminStyles.chipActive : {}) }}
      onClick={() => setRoleFilter(role)}
      aria-pressed={roleFilter === role}
    >
      {label} <strong>{value}</strong>
    </button>
  );

  return (
    <div style={adminStyles.page}>
      <Header screenID="admin" />
      <main style={adminStyles.main}>
        <h1 style={adminStyles.title}>Admin dashboard</h1>
        <p style={adminStyles.subtitle}>Track work orders, manage who can use the app, and review the BMP inventory.</p>

        <div style={adminStyles.tiles}>
          {tile("Total work orders", countOrders(), FileText, "recent")}
          {tile("Pending", countOrders("pending"), Clock, "active")}
          {tile("In progress", countOrders("in_progress"), Wrench, "active")}
          {tile("Completed", countOrders("completed"), SquareCheckBig, "completed")}
        </div>

        <section style={{ ...adminStyles.card, marginBottom: "24px" }}>
          <div style={adminStyles.cardHeader}>
            <h2 style={adminStyles.cardTitle}><ClipboardList size={20} /> Recent work orders</h2>
            <button style={adminStyles.button} onClick={() => setModalTab("recent")}>View all work orders</button>
          </div>
          {ordersError ? (
            <p style={{ ...adminStyles.notice, ...adminStyles.noticeError }}>{ordersError}</p>
          ) : !orders ? (
            <p style={adminStyles.muted}>Loading work orders…</p>
          ) : orders.length === 0 ? (
            <p style={adminStyles.muted}>No work orders yet. One opens each time someone submits an inspection report.</p>
          ) : (
            <ul style={adminStyles.orderList}>
              {orders.slice(0, 5).map(o => (
                <li key={o.id} style={adminStyles.orderRow}>
                  <span>
                    <strong>{o.bmp_name ?? o.bmp_id ?? "No BMP selected"}</strong>
                    <span style={adminStyles.email}> · {formatDate(o.created_at)} by {o.submitted_by ?? "deleted user"}</span>
                  </span>
                  <StatusPill status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div style={adminStyles.columns}>
          <section style={{ ...adminStyles.card, flex: "2 1 520px" }}>
            <div style={adminStyles.cardHeader}>
              <h2 style={adminStyles.cardTitle}>
                Users{roleFilter && <span style={adminStyles.filterChip}>{ROLE_PLURALS[roleFilter]} only</span>}
              </h2>
              <label style={adminStyles.search}>
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search name or email"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={adminStyles.searchInput}
                />
              </label>
            </div>
            <div style={adminStyles.chips}>
              {chip("All", users?.length ?? "–", null)}
              {ROLES.map(role => chip(ROLE_PLURALS[role], count(role), role))}
            </div>
            <p style={adminStyles.muted}>New accounts start as Visitor. Choose a role to change what someone can open.</p>
            {notice && (
              <p role="status" style={{ ...adminStyles.notice, ...(notice.ok ? adminStyles.noticeOk : adminStyles.noticeError) }}>
                {notice.text}
              </p>
            )}

            {loadError ? (
              <p style={{ ...adminStyles.notice, ...adminStyles.noticeError }}>{loadError}</p>
            ) : !users ? (
              <p style={adminStyles.muted}>Loading users…</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={adminStyles.table}>
                  <thead>
                    <tr>
                      <th style={adminStyles.th}>User</th>
                      <th style={{ ...adminStyles.th, width: "120px" }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(u => (
                      <tr key={u.id}>
                        <td style={adminStyles.td}>
                          {u.username}
                          {u.id === myId && <span style={adminStyles.you}>you</span>}
                          {/* On narrow screens, wrap after the @ rather than inside the domain */}
                          <div style={adminStyles.email}>{u.email.split("@")[0]}@<wbr />{u.email.split("@").slice(1).join("@")}</div>
                        </td>
                        <td style={adminStyles.td}>
                          <select
                            value={u.role}
                            disabled={u.id === myId || savingId !== null}
                            title={u.id === myId ? "You can't change your own role" : undefined}
                            onChange={e => changeRole(u, e.target.value as Role)}
                            style={adminStyles.select}
                            aria-label={`Role for ${u.username}`}
                          >
                            {ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {shown.length === 0 && (
                      <tr><td colSpan={2} style={{ ...adminStyles.td, color: "#6b7280" }}>No users match.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <BmpInventory />
        </div>
      </main>
      {modalTab && orders && (
        <WorkOrdersModal orders={orders} initialTab={modalTab} onClose={closeModal} onStatusChange={changeStatus} />
      )}
    </div>
  );
}

const adminStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    color: "#111827",
  },
  main: {
    boxSizing: "border-box",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "calc(10vh + 32px) 24px 48px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#4b5563",
    fontSize: "17px",
  },
  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  tile: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    alignItems: "center",
    columnGap: "10px",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "2px solid transparent",
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    color: "#111827",
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  tileValue: {
    fontSize: "28px",
    fontWeight: 700,
  },
  tileLabel: {
    gridColumn: "1 / -1",
    color: "#4b5563",
    fontSize: "14px",
  },
  columns: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "flex-start",
  },
  card: {
    boxSizing: "border-box",
    minWidth: 0,
    backgroundColor: "#fff",
    borderRadius: "12px",
    borderTop: "4px solid #f7cc0d",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    padding: "20px 24px",
  },
  cardHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
    fontSize: "19px",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  chip: {
    padding: "5px 12px",
    borderRadius: "9999px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#111827",
    font: "inherit",
    fontSize: "14px",
    cursor: "pointer",
  },
  chipActive: {
    borderColor: "#000",
    backgroundColor: "#000",
    color: "#f7cc0d",
  },
  orderList: {
    listStyle: "none",
    padding: 0,
    margin: "12px 0 0",
  },
  orderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  filterChip: {
    padding: "2px 10px",
    borderRadius: "9999px",
    backgroundColor: "#fef3c7",
    fontSize: "13px",
    fontWeight: 600,
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#6b7280",
  },
  searchInput: {
    border: "none",
    outline: "none",
    font: "inherit",
    width: "190px",
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
  noticeOk: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  noticeError: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  noticeWarn: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "2px solid #e5e7eb",
    color: "#4b5563",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
  },
  email: {
    color: "#4b5563",
    fontSize: "14px",
    overflowWrap: "break-word",
  },
  you: {
    marginLeft: "8px",
    padding: "1px 8px",
    borderRadius: "9999px",
    backgroundColor: "#000",
    color: "#f7cc0d",
    fontSize: "12px",
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    font: "inherit",
    backgroundColor: "#fff",
  },
  button: {
    display: "inline-block",
    marginTop: "6px",
    padding: "10px 20px",
    borderRadius: "10px",
    backgroundColor: "#000",
    border: "none",
    color: "#f7cc0d",
    font: "inherit",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },
};

export default Admin;
