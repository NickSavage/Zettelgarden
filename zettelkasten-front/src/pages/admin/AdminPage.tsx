import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { MenuIcon } from "../../assets/icons/MenuIcon";

import { AdminUserIndex } from "./AdminUserIndex";
import { AdminUserDetailPage } from "./AdminUserDetailPage";
import { AdminEditUserPage } from "./AdminEditUserPage";
import { AdminMailingListPage } from "./AdminMailingListPage";
import { AdminMailingListSendPage } from "./AdminMailingListSendPage";
import { AdminMailingListHistoryPage } from "./AdminMailingListHistoryPage";

import { Routes, Route } from "react-router-dom";

export function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-white rounded shadow"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <MenuIcon />
      </button>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-[45]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative
          w-64
          min-w-[16rem]
          max-w-[16rem]
          flex-shrink-0
          h-screen
          bg-gray-800
          flex flex-col
          transform
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          transition-transform
          duration-300
          ease-in-out
          z-[50]
        `}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4">
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/admin" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Users
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/mailing-list" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Mailing List Subscribers
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/mailing-list/send" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Send Mailing List Message
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/mailing-list/history" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Message History
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/app" 
                    className="block py-2 px-4 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
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
              <Route path="mailing-list/history" element={<AdminMailingListHistoryPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
