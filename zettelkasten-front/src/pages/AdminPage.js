import React, { useState, useEffect } from "react";
import { checkAdmin, getUsers } from "../api";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import AdminTopBar from "../components/AdminTopBar";

import { AdminUserIndex } from "./AdminUserIndex";

import { AdminUserDetailPage } from "./AdminUserDetailPage";
import { AdminEditUserPage } from "./AdminEditUserPage";

import { Routes, Route } from "react-router-dom";

export function Admin() {

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
	<Routes>
	    <Route path="/" element={<AdminUserIndex />} />
	    <Route path="user/:id" element={<AdminUserDetailPage />} />
	    <Route path="user/:id" element={<AdminEditUserPage />} />
	</Routes>
      </div>
    </div>
  );
}
