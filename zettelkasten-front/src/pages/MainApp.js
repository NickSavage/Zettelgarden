import React, { useState, useEffect } from "react";
import "../App.css";
import { SearchPage } from "../pages/SearchPage";
import { UserSettingsPage } from "../pages/UserSettings";
import { FileVault } from "../pages/FileVault";
import { ViewPage } from "../pages/ViewPage";
import { EditPage } from "../pages/EditPage";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { getCurrentUser } from "../api";
import { EmailValidationBanner } from "../components/EmailValidationBanner";
import { BillingSuccess } from "../pages/BillingSuccess";
import { BillingCancelled } from "../pages/BillingCancelled";
import { SubscriptionPage } from "../pages/SubscriptionPage";
import { DashboardPage } from "../pages/DashboardPage";

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
    const { isAuthenticated, isLoading, logoutUser } = useAuth();
    const [isActive, setIsActive] = useState(false);

    
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

  async function fetchCurrentUser() {
    let response = await getCurrentUser();
      setCurrentUser(response);
      setIsActive(response["is_active"]);
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

    console.log([isLoading, isActive])
    if (!isLoading && !isActive) {
	return (<SubscriptionPage />)
    }
  return (
    <div>
      <Topbar
        handleNewCard={handleNewCard}
        handleViewFileVault={handleViewFileVault}
        handleViewSettings={handleViewSettings}
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
            <Route path="settings" element={<UserSettingsPage />} />
	      <Route path="settings/billing/success" element={<BillingSuccess />} />
	      <Route path="settings/billing/cancelled" element={<BillingCancelled />} />
            <Route path="files" element={<FileVault />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default MainApp;
