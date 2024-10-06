import React, { FormEvent, useState, useEffect } from "react";
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
      navigate("/app/");
    } catch (message) {
      setError("Login Failed: " + message);
    }
  };

  useEffect(() => {
    console.log("Asdas");
    console.log(import.meta.env.VITE_URL);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">Zettelgarden</h2>
        <div className="text-center text-red-500 mb-4">
          {error && <span>{error}</span>}
        </div>
        <div className="text-center text-green-500 mb-4">
          {message && <span>{message}</span>}
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition duration-200"
          >
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          <span className="block">
            Need an account?{" "}
            <Link to="/register" className="text-indigo-500 hover:underline">
              Register here
            </Link>
            .
          </span>
          <span className="block mt-2">
            <Link to="/reset" className="text-indigo-500 hover:underline">
              Forgot your password?
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
