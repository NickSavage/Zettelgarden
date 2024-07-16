import React, { FormEvent, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { login } from "../api/auth";

import { Link, useNavigate, useLocation } from "react-router-dom";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(email, password);
      loginUser(response);
      navigate("/app");
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
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
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
