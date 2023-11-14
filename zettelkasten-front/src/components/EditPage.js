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
  const [link, setLink] = useState("");

  function handleLinkInputChange(e) {
    setLink(e.target.value);
    const matchingCard = cards.find((card) => card.card_id === e.target.value);

    // Update linktitle with the title of the matching card, or an empty string if no match is found
    setLinktitle(matchingCard ? matchingCard.title : "");
  }
  function handleEnterPress(e) {
    if (e.key === "Enter") {
      let text = "\n[" + link + "] - " + linktitle;
      // Call the function you want to run when Enter is pressed
      console.log("Enter was pressed!");

      setLink("");
      // Your specific function to run
      setEditingCard((prevEditingCard) => ({
        ...editingCard,
        body: editingCard.body + text, // Append the text
      }));
    }
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
      <div style={{ display: "flex", alignItems: "center" }}>
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
