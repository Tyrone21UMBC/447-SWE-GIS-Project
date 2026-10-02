import * as React from "react";
import "./Login.css"
import Header from  "../components/Header.tsx"
import { useState, FormEvent, ChangeEvent } from "react";











export default function Login () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError('');
    setIsLoading(true);

    if (!email || ! password) {
      setError('Please fill out all fields.');
      setIsLoading(false);
      return;
    }

    try {
      return;
    }
    catch {
      return;
    }

  }
  return (

    <div className="form-wrapper">
      <Header />
      <form className="form" onSubmit={handleSubmit}>
        <h1 className="form-title">LOGIN</h1>
        <div className="form-group"> 
          <label htmlFor="Username"> Email </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="input-field"
            />
        </div>
        <div className="form-group">
          <label htmlFor="Password"> Password </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="input-field"
          />
        </div>
        <button>Submit</button>
      </form>
    </div>
  )
}


