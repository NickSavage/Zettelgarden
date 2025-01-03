import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

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
  if (!isLoading && !isAdmin) {
    return <div></div>;
  }
  
  return (
<div className="flex h-screen">
  <div className="flex flex-1">
    <div className="w-64 bg-gray-800 text-white p-4">
      <ul>
        <li>
          <Link to="/admin" className="block py-2 px-4 hover:bg-gray-700">Index</Link>
          <Link to="/app" className="block py-2 px-4 hover:bg-gray-700">Back to App</Link>
        </li>
      </ul>
    </div>
    <div className="flex-1 p-4">
      <Routes>
        <Route path="/" element={<AdminUserIndex />} />
        <Route path="user/:id" element={<AdminUserDetailPage />} />
        <Route path="user/:id/edit" element={<AdminEditUserPage />} />
      </Routes>
    </div>
  </div>
</div>
  );
}
