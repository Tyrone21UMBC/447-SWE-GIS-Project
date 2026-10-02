import * as React from "react";
import "./Login.css"
import Header from  "../components/Header.tsx"
import { useState } from "react";
import { useNavigate } from "react-router";
const API_URL = "http://localhost:8000";


export default function Login () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
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

    <div className="form-wrapper">
      <Header />
      <form className="form" onSubmit={handleSubmit} >
        <h1 className="form-title">LOGIN</h1>
        <div className="form-group"> 
          <label htmlFor="Email"> Email </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            />
        </div>
        <div className="form-group">
          <label htmlFor="Password"> Password </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button>Submit</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  )
}


