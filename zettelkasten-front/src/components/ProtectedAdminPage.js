import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import AdminTopBar from "../components/AdminTopBar";

export function ProtectedAdminPage({ children }) {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/app");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <AdminTopBar />
      <div className="main-content">
        <div className="sidebar">
          <ul>
            <li>
              <Link to="/admin">Index</Link>
            </li>
          </ul>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
