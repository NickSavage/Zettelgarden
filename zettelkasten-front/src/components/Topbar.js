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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const username = localStorage.getItem("username");

  // Function to toggle the dropdown
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

    const toggleNewDropdown = () => {
	console.log("?");
	setIsNewDropdownOpen(!isNewDropdownOpen);
	console.log(isNewDropdownOpen);
    };
    
  function handleLogout() {
    logoutUser();
  }
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <a href="#" onClick={handleIndexClick} className="top-bar-index">
          <h1>Zettelkasten</h1>
        </a>
      </div>
      <div className="top-bar-right">
	  <div className="dropdown">
              <button className="btn" onClick={toggleNewDropdown}>
		  +
              </button>
              {isNewDropdownOpen && (
		  <div className="dropdown-content">
		      <a href="#settings" onClick={handleNewCard}>
			  New Card
		      </a>
		  </div>
              )}
	  </div>
        <button className="btn" onClick={handleViewFileVault}>
          File Vault
        </button>
        <button className="btn" onClick={handleOpenSearch}>
          Search
        </button>
        <div className="dropdown">
          <button className="btn" onClick={toggleProfileDropdown}>
            {username}
          </button>

          {/* Dropdown Content */}
          {isProfileDropdownOpen && (
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
