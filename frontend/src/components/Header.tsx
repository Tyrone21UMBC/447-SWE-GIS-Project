import "./Header.css"
import { NavLink, useLocation } from "react-router"
import type { CSSProperties } from "react";




// Header Styles
const headerStyles: Record<string, CSSProperties> = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "10vh",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #d1d5db",
  },

  headerTitle: {
    margin: 0,
    fontSize: "24px",
  },

  headerLogo: {
    maxHeight: "6vh",
    width: "auto",
    display: "block",
  },

  loginButton: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    color: "#ffffff",
    backgroundColor: "#000000",
    borderRadius: "5px",
    fontSize: "16px",
    textDecoration: "none",
    cursor: "pointer",
  },
};



function Header() {
  const location = useLocation();

  const targetPath = location.pathname === "/login" ? "/" : "/login";
  const linkText = location.pathname === "/login" ? "Home" : "Login";
  return (
    <>
      <nav style={headerStyles.header}>
        <img src='umbc-logo.png' alt="UMBC Logo" style={headerStyles.headerLogo} />
        <h1 style={headerStyles.headerTitle}>
           Facilities Management
        </h1>
        <NavLink to={targetPath} style={headerStyles.loginButton}>{linkText}</NavLink>
      </nav>
    </>

  )
}

export default Header

