import "./Header.css"
import { NavLink, useLocation } from "react-router"
import type { CSSProperties } from "react";
import umbc_logo2 from "./umbc_logo_with_words.png";
import { useState } from 'react';
import { useNavigate } from "react-router";



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
    // backgroundColor: "#dfc861",
    backgroundColor: "#f7cc0d",
    borderBottom: "1px solid #d1d5db",
  },

  headerTitle: {
    margin: 0,
    fontSize: "24px",
  },

  headerLogo: {
    maxHeight: "8vh",
    width: "auto",
    display: "block",
    paddingRight: "10px",
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
  loginButtonHover: {
    // backgroundColor: "#f7cc0d",
    color: "#f7cc0d",
    padding: "13px 23px",
  },
};



function Header() {
  // using usestate for managing different login hover effects
  const [isHovered, setIsHovered] = useState(false);
  const stored = localStorage.getItem("user");
  const isLoggedIn = stored !== null;
  const navigate = useNavigate();
  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/");
  }
  const location = useLocation();

  const targetPath = location.pathname === "/login" ? "/" : "/login";
  const linkText = location.pathname === "/login" ? "Home" : "Login";
  return (
    <>
      <nav style={headerStyles.header}>
        {/* umbc-logo.png has a white background */}
        {/* <img src='umbc-logo.png' alt="UMBC Logo" style={headerStyles.headerLogo} /> */}
        {/* umbc_logo2 has a transparent bg*/}
        <img src={umbc_logo2} alt="UMBC Logo" style={headerStyles.headerLogo} />
        <h1 style={headerStyles.headerTitle}>Facilities Management Map</h1>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              ...headerStyles.loginButton,
              border: "none",
              ...(isHovered ? headerStyles.loginButtonHover : {}),
            }}
          >Logout</button>
        ) : (<NavLink 
          to={targetPath}
          
          // turn on state when we hover
          onMouseEnter={() => setIsHovered(true)}
          // turn off state when we get off
          onMouseOut={() => setIsHovered(false)}
          style={{
             ...headerStyles.loginButton, ...(isHovered? headerStyles.loginButtonHover : {})
            }}
        >{linkText}
        </NavLink>)
        }
      </nav>
    </>

  )
}

export default Header

