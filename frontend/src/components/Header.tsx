import "./Header.css"
import { NavLink, useLocation, useNavigate } from "react-router"
import { useEffect, useRef, useState } from "react";
import { Map as MapIcon, ClipboardList, LayoutDashboard, Phone, Menu, X, LogOut, LogIn, ChevronDown, type LucideIcon } from "lucide-react";
import shield from "../../public/umbc-shield.png";
import { logout, useSession, type Role } from "../auth.ts";

type Link = { to: string; label: string; icon: LucideIcon; end?: boolean; show: (role: Role | null) => boolean };

// Contact is public; Reports needs a login; Admin needs the admin role
const LINKS: Link[] = [
  { to: "/", label: "Map", icon: MapIcon, end: true, show: () => true },
  { to: "/reports", label: "Reports", icon: ClipboardList, show: role => role !== null },
  { to: "/admin", label: "Admin", icon: LayoutDashboard, show: role => role === "admin" },
  { to: "/contact", label: "Contact", icon: Phone, show: () => true },
];

const ROLE_LABELS: Record<Role, string> = { admin: "Admin", staff: "Staff", visitor: "Visitor" };

const initials = (name: string) =>
  name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";

function Header() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);       // phone menu
  const [accountOpen, setAccountOpen] = useState(false); // account dropdown
  const account = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);

  // Close both menus after navigating
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Click outside or Escape closes the account dropdown and the phone menu
  useEffect(() => {
    if (!menuOpen && !accountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setAccountOpen(false); }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (accountOpen && !account.current?.contains(target)) setAccountOpen(false);
      if (menuOpen && !header.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen, accountOpen]);

  async function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);
    await logout();
    navigate("/");
  }

  const links = LINKS.filter(l => l.show(session?.role ?? null));
  const linkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="app-header" ref={header}>
      <div className="app-header-bar">
        <NavLink to="/" className="brand" aria-label="Facilities Management System, home">
          <img src={shield} alt="" className="brand-logo" />
          <span className="brand-text">
            <span className="brand-org">UMBC</span>
            <span className="brand-name">Facilities Management</span>
          </span>
        </NavLink>

        <nav className="nav-links" aria-label="Main">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {session ? (
            <div className="account" ref={account}>
              <button
                className="account-button"
                onClick={() => setAccountOpen(o => !o)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="avatar" aria-hidden="true">{initials(session.username)}</span>
                <span className="account-name">{session.username}</span>
                <ChevronDown size={16} aria-hidden="true" className={accountOpen ? "chevron open" : "chevron"} />
              </button>
              {accountOpen && (
                <div className="account-menu" role="menu">
                  <div className="account-info">
                    <span className="account-info-name">{session.username}</span>
                    <span className={`role-badge role-${session.role}`}>{ROLE_LABELS[session.role] ?? session.role}</span>
                  </div>
                  <button role="menuitem" className="menu-item" onClick={handleLogout}>
                    <LogOut size={16} aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/register" className="ghost-button">Create account</NavLink>
              <NavLink to="/login" className="primary-button"><LogIn size={16} aria-hidden="true" /> Log in</NavLink>
            </>
          )}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Phones and narrow tablets: the links fold into this panel */}
      {menuOpen && (
        <div id="mobile-menu" className="mobile-menu">
          <nav aria-label="Main">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon size={20} aria-hidden="true" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mobile-account">
            {session ? (
              <>
                <div className="account-info">
                  <span className="avatar" aria-hidden="true">{initials(session.username)}</span>
                  <span className="account-info-name">{session.username}</span>
                  <span className={`role-badge role-${session.role}`}>{ROLE_LABELS[session.role] ?? session.role}</span>
                </div>
                <button className="ghost-button" onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="primary-button"><LogIn size={16} aria-hidden="true" /> Log in</NavLink>
                <NavLink to="/register" className="ghost-button">Create account</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
