import React, { useState, useEffect } from "react";
import "./App.css";
import { getCard, saveNewCard, saveExistingCard } from "./api";
import { SearchPage } from "./components/SearchPage";
import { ViewPage } from "./components/ViewPage";
import { EditPage } from "./components/EditPage";
import { Sidebar } from "./components/Sidebar";

function App() {
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState(null);
  const [viewingCard, setViewCard] = useState(null);
  const [parentCard, setParentCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [searchCard, setSearchCard] = useState(null);
  const [lastCardId, setLastCardId] = useState("");
  const [refreshSidebar, setRefreshSidebar] = useState(false);

  // changing pages

  function changePage() {
    setError(null);
    setViewCard(null);
    setLastCardId(null);
    setEditingCard(null);
    setSearchCard(null);
    setNewCard(null);
  }

  function handleOpenSearch() {
    changePage();
    document.title = "Zettelkasten - Search";
    setSearchCard(true);
  }

  function handleNewCard() {
    changePage();
    setNewCard(true);
    setEditingCard({ card_id: lastCardId, title: "", body: "" });
    document.title = "Zettelkasten - New Card";
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

  useEffect(() => {
    //fetchCards().then(data => setCards(data));
  }, []);

  return (
    <div>
      <Sidebar
        cards={cards}
        setCards={setCards}
        handleNewCard={handleNewCard}
        handleOpenSearch={handleOpenSearch}
        handleViewCard={handleViewCard}
        refreshSidebar={refreshSidebar}
        setRefreshSidebar={setRefreshSidebar}
      />
      <div className="main-content">
        {error && (
          <div>
            <p>Error: {error}</p>
          </div>
        )}
        {searchCard && (
          <SearchPage cards={cards} handleViewCard={handleViewCard} />
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
          />
        )}
      </div>
    </div>
  );
}

export default App;
