import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
export function Topbar({
  handleNewCard,
    handleViewFileVault,
  handleOpenSearch,
  handleViewSettings,
  handleIndexClick,
}) {
  const { logoutUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const username = localStorage.getItem("username");

  // Function to toggle the dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  function handleLogout() {
    logoutUser();
  }
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <a href="#" onClick={handleIndexClick} className="top-bar-index">
          <h2>Zettelkasten</h2>
        </a>
      </div>
      <div className="top-bar-right">
        <button className="btn" onClick={handleNewCard}>
          New Card
        </button>
        <button className="btn" onClick={handleViewFileVault}>
          File Vault
        </button>
        <button className="btn" onClick={handleOpenSearch}>
          Search
        </button>
        <div className="dropdown">
          <button className="btn" onClick={toggleDropdown}>
            {username}
          </button>

          {/* Dropdown Content */}
          {isDropdownOpen && (
            <div className="dropdown-content">
              <a href="#settings" onClick={handleViewSettings}>
                Settings
              </a>
              <a href="#logout" onClick={handleLogout}>
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
