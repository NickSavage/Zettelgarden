import React, { useState } from "react";
import { useAuth } from "../AuthContext";

import { Link, useNavigate, useLocation } from "react-router-dom";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

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
      <h2>Zettelkasten</h2>

      <div className="login-error">{error && <span>{error}</span>}</div>
      <div className="login-error">{message && <span>{message}</span>}</div>
      <form onSubmit={handleLogin}>
        <input
          name="username"
          type="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
      <span className="text">
        Need an account? <Link to="/register">Register here</Link>.
      </span>
      <br />
      <span className="text">
        <Link to="/reset">Forgot your password?</Link>.
      </span>
    </div>
  );
}

export default LoginForm;
