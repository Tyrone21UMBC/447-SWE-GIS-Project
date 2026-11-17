import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";
import { NavLink } from "react-router";
import { MapPin, Phone, Clock, ClipboardList } from "lucide-react";

const PHONE = "410-455-3219";
const ADDRESS = ["Facilities Management Building", "1000 Hilltop Circle", "Baltimore, MD 21250"];
const DIRECTIONS_URL = "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("UMBC Facilities Management, 1000 Hilltop Circle, Baltimore, MD 21250");

// Office hours by weekday (0 = Sunday), in minutes after midnight; null = closed
const OPEN = 8 * 60 + 30, CLOSE = 16 * 60 + 30;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = DAYS.map((_, day) => (day === 0 || day === 6 ? null : { open: OPEN, close: CLOSE }));

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

// The office is on campus, so use Eastern time whatever the viewer's time zone
function campusNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "long", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return { day: DAYS.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function Contact() {
  const now = campusNow();
  const today = HOURS[now.day];
  const isOpen = today !== null && now.minutes >= today.open && now.minutes < today.close;

  return (
    <div style={contactStyles.page}>
      <Header screenID="contact" />
      <main style={contactStyles.main}>
        <h1 style={contactStyles.title}>Contact Facilities Management</h1>
        <p style={contactStyles.subtitle}>
          Questions about a stormwater BMP, an inspection, or this app? Call or stop by during office hours.
        </p>

        <div style={contactStyles.grid}>
          <section style={contactStyles.card}>
            <h2 style={contactStyles.cardTitle}><Phone size={20} /> Call</h2>
            <a href={`tel:+1${PHONE.replaceAll("-", "")}`} style={contactStyles.phone}>{PHONE}</a>
            <p style={contactStyles.muted}>Monday to Friday, {formatTime(OPEN)} – {formatTime(CLOSE)}</p>
          </section>

          <section style={contactStyles.card}>
            <h2 style={contactStyles.cardTitle}><MapPin size={20} /> Visit</h2>
            <address style={contactStyles.address}>
              {ADDRESS.map(line => <div key={line}>{line}</div>)}
            </address>
            <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" style={contactStyles.secondaryButton}>
              Get directions
            </a>
          </section>

          <section style={contactStyles.card}>
            <h2 style={contactStyles.cardTitle}>
              <Clock size={20} /> Hours
              <span style={{ ...contactStyles.badge, ...(isOpen ? contactStyles.badgeOpen : contactStyles.badgeClosed) }}>
                {isOpen ? "Open now" : "Closed now"}
              </span>
            </h2>
            <table style={contactStyles.hours}>
              <tbody>
                {DAYS.map((day, i) => {
                  const hours = HOURS[i];
                  const rowStyle = i === now.day ? contactStyles.today : undefined;
                  return (
                    <tr key={day} style={rowStyle}>
                      <td style={contactStyles.hoursCell}>{day}</td>
                      <td style={{ ...contactStyles.hoursCell, textAlign: "right" }}>
                        {hours ? `${formatTime(hours.open)} – ${formatTime(hours.close)}` : "Closed"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        <section style={contactStyles.reportCard}>
          <ClipboardList size={32} style={{ flexShrink: 0 }} />
          <div style={{ flex: "1 1 300px" }}>
            <h2 style={{ ...contactStyles.cardTitle, marginBottom: "6px" }}>Reporting a problem with a BMP?</h2>
            <p style={{ margin: 0 }}>
              Find the BMP on the map, click it, and choose <strong>Report an issue</strong>. The inspection
              checklist opens with the BMP's details already filled in.
            </p>
          </div>
          <NavLink to="/" style={contactStyles.primaryButton}>Open the map</NavLink>
        </section>
      </main>
    </div>
  );
}

const contactStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    color: "#111827",
  },
  main: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "calc(10vh + 32px) 24px 48px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: "0 0 28px",
    color: "#4b5563",
    fontSize: "17px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    alignItems: "start",
  },
  card: {
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
    margin: "0 0 14px",
    fontSize: "19px",
  },
  phone: {
    display: "block",
    fontSize: "26px",
    fontWeight: 700,
    color: "#000",
    textDecoration: "none",
    marginBottom: "6px",
  },
  muted: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
  },
  address: {
    fontStyle: "normal",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  badge: {
    marginLeft: "auto",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 600,
  },
  badgeOpen: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeClosed: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  hours: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
  },
  hoursCell: {
    padding: "5px 6px",
  },
  today: {
    backgroundColor: "#fef3c7",
    fontWeight: 700,
  },
  reportCard: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "20px",
    marginTop: "24px",
    padding: "24px",
    borderRadius: "12px",
    backgroundColor: "#000",
    color: "#fff",
  },
  primaryButton: {
    padding: "10px 20px",
    borderRadius: "10px",
    backgroundColor: "#f7cc0d",
    color: "#000",
    fontWeight: 600,
    textDecoration: "none",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "2px solid #000",
    color: "#000",
    fontWeight: 600,
    textDecoration: "none",
  },
};

export default Contact;
