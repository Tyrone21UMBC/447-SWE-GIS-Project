import "./Header.css"
import { NavLink, useLocation } from "react-router"
import type { CSSProperties } from "react";
import umbc_logo2 from "./umbc_logo_with_words.png";
import React, { useState } from 'react';




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
    justifyContent: "space-between",
    padding: "0 20px",
    boxSizing: "border-box",
    // backgroundColor: "#dfc861",
    backgroundColor: "#f7cc0d",
    borderBottom: "5px solid #d1d5db",
    
  },

  headerTitle: {
    margin: 0,
    fontSize: "20px",
  },
  headerLogo: {
    maxHeight: "9vh",
    width: "auto",
    display: "block",
    paddingRight: "10px",
  },
  loginButton: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    // color: "#ffffff",
    color: "#f7cc0d",
    backgroundColor: "#000000",
    borderRadius: "9999px",
    fontSize: "16px",
    textDecoration: "none",
    cursor: "pointer",
  },
  loginButtonHover: {
    backgroundColor: "#444",
    color: "#f7cc0d",
    // padding: "13px 23px",
  },
  logoContainer: {
    // border: "2px solid purple",
    display: "flex",
    alignItems: "center",
  },
  headerLinks: {
    // border: "2px solid purple",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    // width: "",
    gap: "1.5rem",
    textDecoration: "none",
    color: "#000",
  },
  headerTabs: {
    textDecoration: "none",
    border: "2px solid #000",
    color: "#000",
    padding: "10px 20px",
    borderRadius: "9999px"
  },
  headerTabsHover: {
    backgroundColor: "#000",
    color: "#f7cc0d",
    border: "2px solid transparent",
  },
};
const screenIDStyling:Record<string, CSSProperties> = {
  button: {
    textDecoration: "none",
    backgroundColor: "#000",
    color: "#f7cc0d",
    border: "2px solid #000",
    padding: "10px 20px",
    borderRadius: "9999px"
  },
  buttonHover: {
    backgroundColor: "#333",
    color: "#f7cc0d",
    border: "2px solid transparent",
  },

};



function Header({ screenID }) {
  // using usestate for managing different login hover effects
 const [isHovered, setIsHovered] = useState(false);
 const [isHoveredLink1, setIsHoveredLink1] = useState(false);
 const [isHoveredLink2, setIsHoveredLink2] = useState(false);
 const [isHoveredLink3, setIsHoveredLink3] = useState(false);
//  const baseStyle = screenID === "contact" ? screenIDStyling.button : headerStyles.headerTabs;
//  const hoverStyle = screenID === "contact" ? screenIDStyling.buttonHover : headerStyles.headerTabsHover;

//   const computedLink1Style = {
//     ...baseStyle,
//     ...(isHoveredLink1 ? hoverStyle : {})
//   };



  const location = useLocation();

  const targetPath1 = location.pathname === "/login" ? "/" : "/login";
  const linkText1 = location.pathname === "/login" ? "Home" : "Login";
  const targetPath2 = location.pathname === "/contact" ? "/" : "/contact";
  const linkText2 = location.pathname === "/contact" ? "Contact" : "Contact";
  const targetPath3 = location.pathname === "/reports" ? "/" : "/reports";
  const linkText3 = location.pathname === "/reports" ? "Reports" : "Reports";
  const targetPath4 = location.pathname === "/admin" ? "/" : "/admin";
  const linkText4 = location.pathname === "/admin" ? "Admin" : "Admin";

  return (
    <>

        <nav style={headerStyles.header}>
            <div style={headerStyles.logoContainer}>
                <img src={umbc_logo2} alt="UMBC Logo" style={headerStyles.headerLogo} />
                <h1 style={headerStyles.headerTitle}>Facilities Management System</h1>
            </div>



            <div style={headerStyles.headerLinks}>
                <NavLink to={targetPath2} 
                  style={
                    screenID === "contact"
                      ? { ...screenIDStyling.button, ...(isHoveredLink1 ? screenIDStyling.buttonHover : {}) }
                      : { ...headerStyles.headerTabs, ...(isHoveredLink1 ? headerStyles.headerTabsHover : {}) }}
                
                    onMouseEnter={() => setIsHoveredLink1(true)} onMouseOut={() => setIsHoveredLink1(false)}
                >
                    {linkText2}
                </NavLink>
                <NavLink to={targetPath3} 
                  style={
                    screenID === "reports"
                      ? { ...screenIDStyling.button, ...(isHoveredLink2 ? screenIDStyling.buttonHover : {}) }
                      : { ...headerStyles.headerTabs, ...(isHoveredLink2 ? headerStyles.headerTabsHover : {}) }}
                
                    onMouseEnter={() => setIsHoveredLink2(true)} onMouseOut={() => setIsHoveredLink2(false)}>
                    {linkText3}
                </NavLink>
                <NavLink to={targetPath4} 
                  style={
                    screenID === "admin"
                      ? { ...screenIDStyling.button, ...(isHoveredLink3 ? screenIDStyling.buttonHover : {}) }
                      : { ...headerStyles.headerTabs, ...(isHoveredLink3 ? headerStyles.headerTabsHover : {}) }}
                
                    onMouseEnter={() => setIsHoveredLink3(true)} onMouseOut={() => setIsHoveredLink3(false)}>
                    {linkText4}
                </NavLink>
            </div>



            <div style={headerStyles.loginContainer}>
                <NavLink 
                to={targetPath1}
                
                // turn on state when we hover
                onMouseEnter={() => setIsHovered(true)}
                // turn off state when we get off
                onMouseOut={() => setIsHovered(false)}
                style={{
                    ...headerStyles.loginButton, ...(isHovered? headerStyles.loginButtonHover : {})
                    }}
                >{linkText1}
                </NavLink>
            </div>
        </nav>


    </>

  )
}

export default Header

