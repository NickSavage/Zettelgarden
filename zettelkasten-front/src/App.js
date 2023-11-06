import React, { useState, useEffect } from "react";
import "./App.css";
import { fetchCards, getCard, saveCard } from "./api";
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

  const base_url = process.env.REACT_APP_URL;

  async function handleSaveCard() {
    const url = newCard
      ? base_url + `/cards`
      : base_url + `/cards/${encodeURIComponent(editingCard.id)}`;
    const method = newCard ? "POST" : "PUT";

    let card = editingCard;

    saveCard(url, method, card)
      .then((response) => response.json())
      .then((response) => {
        if (!("error" in response)) {
          handleViewCard(response);
        } else {
          setError(response["error"]);
        }
        setRefreshSidebar(true);
        //fetchCards().then(data => setCards(data));
      });
  }
  // helper

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
    setViewCard(card);
    setLastCardId(card.card_id);
    if ("id" in card.parent) {
      let parentCardId = card.parent.id;
      const parentCard = await getCard(parentCardId);
      setParentCard(parentCard);
    } else {
      setParentCard(null);
    }
  }

  function handleEditCard() {
    changePage();
    document.title = "Zettelkasten - Edit Card";
    setEditingCard(viewingCard);
  }

  async function handleViewBacklink(backlink) {
    // Assuming backlink is an object with id and title, you can just use the id to view the card.
    const cardData = await getCard(backlink.id);
    if ("error" in cardData) {
      setError(cardData["error"]);
    } else {
      handleViewCard(cardData);
    }
  }
  async function handleSidebarCardClick(card) {
    // Call getCard with the card's id and then call handleViewCard with the fetched cardData
    const cardData = await getCard(card.id);
    handleViewCard(cardData);
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
        handleSidebarCardClick={handleSidebarCardClick}
        refreshSidebar={refreshSidebar}
        setRefreshSidebar={setRefreshSidebar}
      />
      <div
        className="main-content"
      >
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
            handleViewBacklink={handleViewBacklink}
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
