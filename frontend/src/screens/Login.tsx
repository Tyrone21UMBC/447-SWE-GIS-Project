import * as React from "react";
import "./Login.css"
import Header from  "../components/Header.tsx"












function Login () {
  return (

    <div className="form-wrapper">
      <Header />
      <form className="form">
        <h1 className="form-title">LOGIN</h1>
        <div className="form-group"> 
          <label htmlFor="Username"> Username </label>
          <input />
        </div>
        <div className="form-group">
          <label htmlFor="Password"> Password </label>
          <input />
        </div>
      </form>
    </div>
  )
}


export default Login
