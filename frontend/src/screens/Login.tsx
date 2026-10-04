import * as React from "react";
import type { CSSProperties } from 'react';
import "./Login.css"
import Header from  "../components/Header.tsx"
import { useState } from "react";
import { useNavigate } from "react-router";
import mapBG from "./mapBG.png";
const API_URL = "http://localhost:8000";


const loginStyles: Record<string, CSSProperties> = {
  formWrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    minWidth: "100vw",
    // backgroundColor: "#ffffff",

    backgroundImage: `url(${mapBG})`,
    // backgroundSize: "cover",
    backgroundPosition: "left",
  },
  form: {
    backgroundColor: "#f3f4f6",
    padding: "2.5rem",
    paddingTop: ".2rem",
    borderRadius: "12px",
    border: "1px solid #f7cc0d",
    width: "25%",
    height: "fit-content",
  },
  formTitle: {
    color: "#000000",
  },
  formGroup: {
    padding: "5px",
  },
  inputField: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
  },
  buttonStyles: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    color: "gold",
    borderRadius: "9999px",
    cursor: "pointer",
    width: "100%",
    padding: "8px",
    fontSize: "15px",
    border: "none",
  },
  buttonStylesHover: {
    // background: "gold",
    // color: "black",
    backgroundColor: "#444",
    color: "gold",
  },
  smallerText: {
    fontSize: "14px",
  },

};





export default function Login () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // useState for login box hover
  const [isLoginButtonHovered, setIsLoginButtonHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    setError('');

    if (!email || ! password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
     const res = await fetch(`${API_URL}/login`, {
       method : "POST",
       headers : {"Content-Type":"application/json"},
       body : JSON.stringify({ email,password })
     });

     if (!res.ok) {
      const err = await res.json();
      setError(err.detail ?? "Login failed");
      return;
     }
     const data = await res.json();
     console.log("Logged in as ", data.username);
     navigate("/"); //success: go to the application

    } catch {
      setError("Could not reach the server");
    }

  }
  return (

    <div style={loginStyles.formWrapper}>
      <Header />
      <form style={loginStyles.form} onSubmit={handleSubmit} >
        <h1 style={loginStyles.formTitle}>LOGIN</h1>
        <div style={loginStyles.formGroup}> 
          <label htmlFor="Email"> Email </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={loginStyles.inputField}
            />
        </div>
        <div style={loginStyles.formGroup}>
          <label htmlFor="Password"> Password </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={loginStyles.inputField}
          />
        </div>
        <div style={{ ...loginStyles.formGroup, ...loginStyles.smallerText }}>
          <p>Don't have an account? <a href="/register">Register here</a></p>

        </div>
        <button 
        onMouseOver={() => setIsLoginButtonHovered(true)}
        onMouseOut={() => setIsLoginButtonHovered(false)}
        style={{ ...loginStyles.buttonStyles, ...(isLoginButtonHovered ? loginStyles.buttonStylesHover : {}) }}>Submit</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  )
}


