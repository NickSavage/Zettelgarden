import React, { useState, useEffect } from "react";
import "../App.css";
import { SearchPage } from "../components/SearchPage";
import { SettingsPage } from "../components/SettingsPage";
import { FileVault } from "../components/FileVault";
import { ViewPage } from "../components/ViewPage";
import { EditPage } from "../components/EditPage";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { getCurrentUser } from "../api";
import { EmailValidationBanner } from "../components/EmailValidationBanner";

function MainApp() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newCard, setNewCard] = useState(null);
  const [lastCardId, setLastCardId] = useState("");
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCards, setSearchCards] = useState([]);
  const { isAuthenticated, logoutUser } = useAuth();

  // changing pages

  async function handleNewCard(cardType) {
    navigate("/app/card/new", { state: { cardType: cardType } });
  }
  function handleViewFileVault() {
    navigate("/app/files");
  }
  function handleViewSettings() {
    navigate("/app/settings");
  }
  function handleIndexClick() {}

  async function fetchCurrentUser() {
    let response = await getCurrentUser();
    setCurrentUser(response);
  }

  useEffect(() => {
    // Check if token does not exist or user is not authenticated
    if (!localStorage.getItem("token")) {
      logoutUser(); // Call your logout function
      navigate("/login"); // Redirect to the login page
    } else {
      fetchCurrentUser();
    }
  }, [isAuthenticated]); // Dependency array, rerun effect if isAuthenticated changes

  return (
    <div>
      <Topbar
        handleNewCard={handleNewCard}
        handleViewFileVault={handleViewFileVault}
        handleViewSettings={handleViewSettings}
        handleIndexClick={handleIndexClick}
      />
      <div className="main-content">
        <Sidebar
          cards={cards}
          setCards={setCards}
          refreshSidebar={refreshSidebar}
          setRefreshSidebar={setRefreshSidebar}
        />
        <div className="content">
          {error && (
            <div>
              <p>Error: {error}</p>
            </div>
          )}
          {currentUser && <EmailValidationBanner user={currentUser} />}

          <Routes>
            <Route
              path="search"
              element={
                <SearchPage
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  cards={searchCards}
                  setCards={setSearchCards}
                />
              }
            />
            <Route
              path="card/:id"
              element={<ViewPage cards={cards} setLastCardId={setLastCardId} />}
            />
            <Route
              path="card/:id/edit"
              element={
                <EditPage
                  cards={cards}
                  newCard={newCard}
                  setRefreshSidebar={setRefreshSidebar}
                />
              }
            />

            <Route
              path="card/new"
              element={
                <EditPage
                  cards={cards}
                  newCard={true}
                  setRefreshSidebar={setRefreshSidebar}
                  lastCardId={lastCardId}
                />
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="files" element={<FileVault />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default MainApp;
