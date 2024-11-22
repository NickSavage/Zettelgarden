import React, { useEffect } from "react";
import { Admin } from "./pages/admin/AdminPage";
import LandingPage from "./landing/LandingPage";
import LoginForm from "./pages/LoginPage";
import MainApp from "./pages/MainApp";
import RegisterPage from "./pages/RegisterPage";
import { Routes, Route } from "react-router-dom";
import PasswordReset from "./pages/PasswordReset";
import EmailValidation from "./pages/EmailValidation";
import { useAuth } from "./contexts/AuthContext";

import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated && location.pathname === "/") {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]); // Add dependencies

  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<MainApp />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset" element={<PasswordReset />} />
        <Route path="/validate" element={<EmailValidation />} />
      </Routes>
    </div>
  );
}

export default App;
