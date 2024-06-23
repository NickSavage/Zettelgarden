import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";

interface TopbarProps {
  handleNewCard:(cardType: string) => void,
  handleViewFileVault: () => void,
  handleViewSettings: () => void,
}

export function Topbar({
  handleNewCard,
  handleViewFileVault,
  handleViewSettings,
}: TopbarProps) {
  const { logoutUser } = useAuth();
  const { isAdmin } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const username = localStorage.getItem("username");

  const navigate = useNavigate();

  function handleIndexClick() {
    navigate("/app");
  }

  function handleNewStandardCard() {
    handleNewCard("standard");
  }
  function handleNewMeetingCard() {
    handleNewCard("meeting");
  }
  function handleNewReferenceCard() {
    handleNewCard("reference");
  }

  function handleOpenSearch() {
    navigate("/app/search");
  }
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
              <a href="#settings" onClick={handleNewStandardCard}>
                New Card
              </a>
              <a href="#settings" onClick={handleNewReferenceCard}>
                New Reference
              </a>
              <a href="#settings" onClick={handleNewMeetingCard}>
                New Meeting
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
              {isAdmin && <Link to="/admin">Admin</Link>}
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
