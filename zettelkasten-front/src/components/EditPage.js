import React, { useState } from "react";
import { isCardIdUnique } from "../utils";

// Render the warning label
function renderWarningLabel(cards, editingCard) {
  if (!editingCard.card_id) return null;
  if (!isCardIdUnique(cards, editingCard.card_id)) {
    return <span style={{ color: "red" }}>Card ID is not unique!</span>;
  }
  return null;
}

export function EditPage({
  cards,
  editingCard,
  setEditingCard,
  handleSaveCard,
  newCard,
}) {
  const [linktitle, setLinktitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [link, setLink] = useState("");
  const [topResults, setTopResults] = useState([]);

  function handleLinkInputChange(e) {
    setLink(e.target.value);
    const search = e.target.value; // assuming you want case-insensitive matching
    setSearchTerm(search);
    if (search !== "") {
      const exactMatchCard = cards.find((card) => card.card_id === search);
      const matchingCards = cards.filter(
        (card) =>
          card.card_id.toLowerCase().startsWith(search.toLowerCase()) ||
          card.title.toLowerCase().includes(search.toLowerCase()),
      );

      // If an exact match is found, make sure it is at the front of the array
      let filteredCards = exactMatchCard
        ? [exactMatchCard, ...matchingCards]
        : matchingCards;
      filteredCards = filteredCards.filter(
        (card, index, self) =>
          index === self.findIndex((t) => t.card_id === card.card_id),
      );
      // Update linktitle with the title of the matching card, or an empty string if no match is found
      setLinktitle(
        exactMatchCard
          ? exactMatchCard.title
          : matchingCards.length > 0
          ? matchingCards[0].title
          : "",
      );
      let results = filteredCards.slice(0, 5);
      setTopResults(results);
    } else {
      setLinktitle("");
      setTopResults([]);
    }
  }

  function handleEnterPress(e) {
    if (e.key === "Enter") {
      setTopResults([]);
      let enteredCard = topResults.find((card) => card.card_id === searchTerm);
      let text = "";
      if (enteredCard) {
        text = "\n\n[" + enteredCard.card_id + "] - " + enteredCard.title;
      } else {
        text = "";
      }
      setLink("");
      setSearchTerm("");
      setTopResults([]);
      // Your specific function to run
      setEditingCard((prevEditingCard) => ({
        ...editingCard,
        body: editingCard.body + text, // Append the text
      }));
    }
  }

  function createInputDropdown(cards) {
    return (
      <ul className="input-link-dropdown">
        {cards.map((card, index) => (
          <li
            key={card.card_id}
            style={{
              background: "lightgrey",
              cursor: "pointer",
            }}
          >
            {card.card_id} - {card.title}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <label htmlFor="title">Card ID:</label>
      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={editingCard.card_id}
          onChange={(e) =>
            setEditingCard({ ...editingCard, card_id: e.target.value })
          }
          placeholder="ID"
          style={{ display: "block", marginBottom: "10px" }} // Added styles here
        />
        {newCard && renderWarningLabel(cards, editingCard)}
      </div>
      {/* Title Section */}
      <label htmlFor="title">Title:</label>
      <input
        style={{ display: "block", width: "100%", marginBottom: "10px" }} // Updated style here
        type="text"
        id="title"
        value={editingCard.title}
        onChange={(e) =>
          setEditingCard({ ...editingCard, title: e.target.value })
        }
        placeholder="Title"
      />

      {/* Body Section */}
      <label htmlFor="body">Body:</label>
      <textarea
        style={{ display: "block", width: "100%", height: "200px" }} // Updated style here
        id="body"
        value={editingCard.body}
        onChange={(e) =>
          setEditingCard({ ...editingCard, body: e.target.value })
        }
        placeholder="Body"
      />
      <div
        style={{ display: "flex", alignItems: "center", position: "relative" }}
      >
        <label htmlFor="refInput" style={{ marginRight: "10px" }}>
          Add Link:
        </label>
        <input
          type="text"
          value={link}
          onChange={(e) => handleLinkInputChange(e)}
          placeholder="ID"
          onKeyDown={handleEnterPress} // Add the onKeyDown event handler here
          style={{ display: "block", marginRight: "10px" }} // Added styles here
        />
        {linktitle && (
          <div>
            <span>{linktitle}</span>
          </div>
        )}
        {topResults && createInputDropdown(topResults)}
      </div>
      <label htmlFor="title">Link:</label>
      <input
        style={{ display: "block", width: "100%", marginBottom: "10px" }} // Updated style here
        type="text"
        id="link"
        value={editingCard.link}
        onChange={(e) =>
          setEditingCard({ ...editingCard, link: e.target.value })
        }
        placeholder="Title"
      />
      <button onClick={handleSaveCard}>Save</button>
    </div>
  );
}
