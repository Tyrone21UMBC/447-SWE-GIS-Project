import "./Header.css"
import { NavLink, useLocation } from "react-router"








function Header() {
  const location = useLocation();

  const targetPath = location.pathname === "/login" ? "/" : "/login";
  const linkText = location.pathname === "/login" ? "Home" : "Login";
  return (
    <>
      <nav className="header">
        <img src='umbc-logo.png' alt="UMBC Logo" className='header-logo' />
        <h1 className='header-title'>
           Facilities Management
        </h1>
        <NavLink to={targetPath} className="login-button">{linkText}</NavLink>
      </nav>
    </>

  )
}

export default Header

