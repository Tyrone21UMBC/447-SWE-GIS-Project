import * as React from "react";
import Header from "../components/Header.tsx";
import { useState } from "react";
import { useNavigate } from "react-router";
import { loginStyles } from "./Login.tsx";
const API_URL = "http://localhost:8000";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // useState for register box hover
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        // FastAPI sends a string for HTTPException, but a list of objects for 422 validation errors
        if (res.status === 422) {
          setError("Please use your @umbc.edu email address.");
        } else {
          setError(typeof err.detail === "string" ? err.detail : "Registration failed");
        }
        return;
      }
      navigate("/login"); // success: log in with the new account
    } catch {
      setError("Could not reach the server");
    }
  };

  return (
    <div style={loginStyles.formWrapper}>
      <Header screenID="login" />
      <form style={loginStyles.form} onSubmit={handleSubmit}>
        <h1 style={loginStyles.formTitle}>REGISTER</h1>
        <div style={loginStyles.formGroup}>
          <label htmlFor="username"> Username </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={loginStyles.inputField}
          />
        </div>
        <div style={loginStyles.formGroup}>
          <label htmlFor="email"> Email </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={loginStyles.inputField}
          />
        </div>
        <div style={loginStyles.formGroup}>
          <label htmlFor="password"> Password </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={loginStyles.inputField}
          />
        </div>
        <div style={loginStyles.formGroup}>
          <label htmlFor="confirmPassword"> Confirm Password </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={loginStyles.inputField}
          />
        </div>
        <div style={{ ...loginStyles.formGroup, ...loginStyles.smallerText }}>
          <p>Already have an account? <a href="/login">Log in here</a></p>
        </div>
        <button
          onMouseOver={() => setIsButtonHovered(true)}
          onMouseOut={() => setIsButtonHovered(false)}
          style={{ ...loginStyles.buttonStyles, ...(isButtonHovered ? loginStyles.buttonStylesHover : {}) }}>Submit</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
