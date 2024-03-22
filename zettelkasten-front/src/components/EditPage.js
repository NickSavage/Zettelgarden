import React, { useState, useEffect } from "react";
import { isCardIdUnique } from "../utils";
import { uploadFile, deleteCard } from "../api";
import { FileListItem } from "./FileListItem";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";
import { useNavigate, useLocation } from "react-router-dom";

import { getCard, saveNewCard, saveExistingCard, getNextId } from "../api";

import { useParams } from "react-router-dom";

// Render the warning label
function renderWarningLabel(cards, editingCard) {
  if (!editingCard.card_id) return null;
  if (!isCardIdUnique(cards, editingCard.card_id)) {
    return <span style={{ color: "red" }}>Card ID is not unique!</span>;
  }
  return null;
}

export function EditPage({ cards, newCard, setRefreshSidebar, lastCardId }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [linktitle, setLinktitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [link, setLink] = useState("");
  const [topResults, setTopResults] = useState([]);
  const [editingCard, setEditingCard] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cardType = location.state?.cardType;

  async function fetchCard(id) {
    let refreshed = await getCard(id);

    setEditingCard(refreshed);
  }

  async function handleSaveCard() {
    let response;
    if (newCard) {
      response = await saveNewCard(editingCard);
    } else {
      response = await saveExistingCard(editingCard);
    }

    if (!("error" in response)) {
      navigate(`/app/card/${response.id}`);
    } else {
      setError(response["error"]);
    }
    setRefreshSidebar(true);
  }
  async function prefillNextId() {
    let nextId;
    if (cardType === "reference" || cardType === "meeting") {
      let response = await getNextId(cardType);
      nextId = response["new_id"];
    } else {
      nextId = lastCardId;
    }
    return nextId;
  }
  useEffect(() => {
    if (!newCard) {
      fetchCard(id);
    } else {
      prefillNextId().then((nextId) => {
        setEditingCard({ card_id: nextId, title: "", body: "" });
      });
    }
  }, [id]);

  function onFileDelete(file_id) {}

  function handleCancelButtonClick() {
    navigate(`/app/card/${editingCard.id}`);
  }
  function handleDeleteButtonClick() {
    if (
      window.confirm(
        "Are you sure you want to delete this card? This cannot be reversed",
      )
    ) {
      deleteCard(editingCard["id"])
        .then(() => setRefreshSidebar(true))
        .catch((error) =>
          setMessage(
            "Unable to delete card. Does it have backlinks, children or files?",
          ),
        );
    }
  }

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

  function handleBodyChange(event) {
    console.log(event);
    setEditingCard({ ...editingCard, body: event.target.value });
  }

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (newCard) {
      setMessage(
        "Error: Cannot upload files for new cards, please save the card first",
      );
      return;
    }
    const files = event.dataTransfer.files;

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        try {
          const response = await uploadFile(files[i], editingCard["id"]);
          setMessage("File uploaded successfully: " + response["file"]["name"]);
        } catch (error) {
          setMessage("Error uploading file: " + error, error);
        }
      }
    }
  };
  const handlePaste = async (event) => {
    // Prevent the default pasting action
    event.preventDefault();

    // Check if there are any items being pasted
    if (event.clipboardData && event.clipboardData.items) {
      const items = event.clipboardData.items;

      for (const item of items) {
        // Check if the item is an image
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();

          if (newCard) {
            setMessage(
              "Error: Cannot upload images for new cards, please save the card first",
            );
            return;
          }

          try {
            const response = await uploadFile(file, editingCard["id"]);
            let append_text = "\n\n![](" + response["file"]["id"] + ")";
            setMessage(
              `File uploaded successfully: ${response["file"]["name"]}`,
            );

            // if uploading an image, we want to automatically link it in the body
            setEditingCard((prevEditingCard) => ({
              ...editingCard,
              body: editingCard.body + append_text, // Append the text
            }));
          } catch (error) {
            setMessage(`Error uploading file: ${error}`);
          }
        } else {
          // If the pasted content is not an image, handle the usual text pasting
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  function addBacklink(selectedCard) {
    let text = "";
    if (selectedCard) {
      text = "\n\n[" + selectedCard.card_id + "] - " + selectedCard.title;
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
  function handleEnterPress(e) {
    if (e.key === "Enter") {
      setTopResults([]);
      let enteredCard = topResults.find((card) => card.card_id === searchTerm);
      addBacklink(enteredCard);
    }
  }

  return (
    <div>
      {editingCard && (
        <div>
          <div>{message && <span>{message}</span>}</div>
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

          <label htmlFor="body">Body:</label>
          <textarea
            style={{ display: "block", width: "100%", height: "200px" }} // Updated style here
            id="body"
            value={editingCard.body}
            onChange={handleBodyChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
            placeholder="Body"
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
            }}
          >
            <label htmlFor="refInput" style={{ marginRight: "10px" }}>
              Add Backlink:
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => handleLinkInputChange(e)}
              placeholder="ID"
              onKeyDown={handleEnterPress}
              style={{ display: "block", marginRight: "10px" }}
            />
            {topResults && (
              <BacklinkInputDropdownList
                addBacklink={addBacklink}
                cards={topResults}
              />
            )}
          </div>
          <label htmlFor="title">Source/URL:</label>
          <input
            style={{ display: "block", width: "100%", marginBottom: "10px" }}
            type="text"
            id="link"
            value={editingCard.link}
            onChange={(e) =>
              setEditingCard({ ...editingCard, link: e.target.value })
            }
            placeholder="Title"
          />
          <button onClick={handleSaveCard}>Save</button>
          <button onClick={handleCancelButtonClick}>Cancel</button>
          {!newCard && (
            <button onClick={handleDeleteButtonClick}>Delete</button>
          )}
          {!newCard && (
            <div>
              <h4>Files:</h4>
              <ul>
                {editingCard.files.map((file, index) => (
                  <FileListItem
                    file={file}
                    onDelete={onFileDelete}
                    handleViewCard={null}
                    openRenameModal={null}
                    displayCard={false}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
