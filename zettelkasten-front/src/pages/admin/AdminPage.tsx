import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { AdminUserIndex } from "./AdminUserIndex";
import { AdminUserDetailPage } from "./AdminUserDetailPage";
import { AdminEditUserPage } from "./AdminEditUserPage";
import { AdminMailingListPage } from "./AdminMailingListPage";
import { AdminMailingListSendPage } from "./AdminMailingListSendPage";

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!isLoading && !isAdmin) {
    return <div></div>;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gray-800">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4">
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/admin" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    Users
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/mailing-list" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    Mailing List
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/mailing-list/send" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    Send Newsletter
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/app" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    Back to App
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <Routes>
              <Route path="/" element={<AdminUserIndex />} />
              <Route path="user/:id" element={<AdminUserDetailPage />} />
              <Route path="user/:id/edit" element={<AdminEditUserPage />} />
              <Route path="mailing-list" element={<AdminMailingListPage />} />
              <Route path="mailing-list/send" element={<AdminMailingListSendPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
