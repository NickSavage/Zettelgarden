import React, { useState } from "react";
import { useAuth } from "../AuthContext";

import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
    const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const base_url = process.env.REACT_APP_URL;
    try {
      const response = await fetch(base_url + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data["error"]);
      } else {
        loginUser(data); // pass the token you received from the backend
	  navigate("/app");
      }
      // Redirect to a protected route or dashboard here.
    } catch (message) {
      setError("Login Failed: " + message);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Zettelkasten</h1>

      <div className="login-error">{error && <span>{error}</span>}</div>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="login-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="login-input"
        />
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;