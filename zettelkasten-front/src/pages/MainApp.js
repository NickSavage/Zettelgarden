import React, { useState, useEffect } from "react";
import "../App.css";
import { getCard, saveNewCard, saveExistingCard, getNextId } from "../api";
import { SearchPage } from "../components/SearchPage";
import { SettingsPage } from "../components/SettingsPage";
import { FileVault } from "../components/FileVault";
import { ViewPage } from "../components/ViewPage";
import { EditPage } from "../components/EditPage";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

function MainApp() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState(null);
  const [viewingCard, setViewCard] = useState(null);
  const [viewFileVault, setViewFileVault] = useState(null);
  const [viewSettings, setViewSettings] = useState(null);
  const [parentCard, setParentCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [searchCard, setSearchCard] = useState(null);
  const [lastCardId, setLastCardId] = useState("");
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCards, setSearchCards] = useState([]);
  const { isAuthenticated, logoutUser } = useAuth();

  // changing pages

  function changePage() {
    setError(null);
    setViewCard(null);
    setLastCardId(null);
    setEditingCard(null);
    setSearchCard(null);
    setNewCard(null);
    setViewSettings(null);
    setViewFileVault(null);
  }

  function handleOpenSearch() {
    changePage();
    document.title = "Zettelkasten - Search";
    setSearchCard(true);
  }
  async function handleNewCard(cardType) {
    changePage();
    setNewCard(true);
    let nextId;
    if (cardType === "reference" || cardType === "meeting") {
	let response = await getNextId(cardType);
	nextId = response["new_id"]
    } else {
      nextId = lastCardId;
    }

    setEditingCard({ card_id: nextId, title: "", body: "" });
    document.title = "Zettelkasten - New Card";
  }
  function handleViewFileVault() {
    changePage();
    document.title = "Zettelkasten - File Vault";
    setViewFileVault(true);
  }
  function handleViewSettings() {
    changePage();
    setViewSettings(true);
    document.title = "Zettelkasten - Settings";
  }
  function handleIndexClick() {
    changePage();
  }

  async function handleViewCard(card) {
    changePage();
    document.title = "Zettelkasten - " + card.card_id + " - " + card.title;
    let refreshed = await getCard(card.id);
    if ("error" in refreshed) {
      setError(refreshed["error"]);
    } else {
      setViewCard(refreshed);
      setLastCardId(refreshed.card_id);
      if ("id" in refreshed.parent) {
        let parentCardId = refreshed.parent.id;
        const parentCard = await getCard(parentCardId);
        setParentCard(parentCard);
      } else {
        setParentCard(null);
      }
    }
  }

  async function handleSaveCard() {
    let response;
    if (newCard) {
      response = await saveNewCard(editingCard);
    } else {
      response = await saveExistingCard(editingCard);
    }

    if (!("error" in response)) {
      handleViewCard(response);
    } else {
      setError(response["error"]);
    }
    setRefreshSidebar(true);
  }

  function handleEditCard() {
    changePage();
    document.title = "Zettelkasten - Edit Card";
    setEditingCard(viewingCard);
  }

  function handleDeleteCard() {
    changePage();
    setEditingCard(null);
    setRefreshSidebar(true);
  }

  useEffect(() => {
    // Check if token does not exist or user is not authenticated
    if (!localStorage.getItem("token")) {
      logoutUser(); // Call your logout function
      navigate("/login"); // Redirect to the login page
    }
  }, [isAuthenticated]); // Dependency array, rerun effect if isAuthenticated changes

  return (
    <div>
      <Topbar
        handleNewCard={handleNewCard}
        handleViewFileVault={handleViewFileVault}
        handleOpenSearch={handleOpenSearch}
        handleViewSettings={handleViewSettings}
        handleIndexClick={handleIndexClick}
      />
      <div className="main-content">
        <Sidebar
          cards={cards}
          setCards={setCards}
          handleViewCard={handleViewCard}
          refreshSidebar={refreshSidebar}
          setRefreshSidebar={setRefreshSidebar}
        />
        <div className="content">
          {error && (
            <div>
              <p>Error: {error}</p>
            </div>
          )}
          {searchCard && (
            <SearchPage
              handleViewCard={handleViewCard}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              cards={searchCards}
              setCards={setSearchCards}
            />
          )}
          {viewingCard && (
            <ViewPage
              viewingCard={viewingCard}
              cards={cards}
              parentCard={parentCard}
              handleViewCard={handleViewCard}
              handleEditCard={handleEditCard}
            />
          )}

          {editingCard && (
            <EditPage
              cards={cards}
              editingCard={editingCard}
              setEditingCard={setEditingCard}
              handleSaveCard={handleSaveCard}
              newCard={newCard}
              handleDeleteCard={handleDeleteCard}
              handleViewCard={handleViewCard}
            />
          )}
          {viewSettings && <SettingsPage />}
          {viewFileVault && <FileVault handleViewCard={handleViewCard} />}
        </div>
      </div>
    </div>
  );
}

export default MainApp;
