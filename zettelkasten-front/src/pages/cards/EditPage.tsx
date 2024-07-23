import React, { useState, useEffect } from "react";
import { isCardIdUnique } from "../../utils";
import { uploadFile, editFile } from "../../api/files";
import {
  deleteCard,
  getNextId,
  saveNewCard,
  saveExistingCard,
  getCard,
} from "../../api/cards";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, PartialCard, defaultCard } from "../../models/Card";
import { File } from "../../models/File";
import { usePartialCardContext } from "../../contexts/CardContext";
import { Button } from "../../components/Button";

interface EditPageProps {
  newCard: boolean;
  lastCardId: string;
}

function handleViewCard(card_pk: number) {}
function openRenameModal(file: File) {}
function onFileDelete(file_id: number) {}

function renderWarningLabel(cards: PartialCard[], editingCard: Card) {
  if (!editingCard.card_id) return null;
  if (!isCardIdUnique(cards, editingCard.card_id)) {
    return <span style={{ color: "red" }}>Card ID is not unique!</span>;
  }
  return null;
}

export function EditPage({ newCard, lastCardId }: EditPageProps) {
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [editingCard, setEditingCard] = useState<Card>(defaultCard);
  const [fileIds, setFileIds] = useState<string[]>([]);
  const { partialCards, setRefreshPartialCards } = usePartialCardContext();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const addFileId = (fileId: string) => {
    setFileIds((prevFileIds) => [...prevFileIds, fileId]);
  };

  async function fetchCard(id: string) {
    let refreshed = await getCard(id);
    setEditingCard(refreshed);
    document.title = "Zettelgarden - " + refreshed.card_id + " - Edit";
  }

  async function handleSaveCard() {
    let response;
    if (newCard) {
      response = await saveNewCard(editingCard);
    } else {
      response = await saveExistingCard(editingCard);
    }

    if (!("error" in response)) {
      // if (newCard) {
      //   fileIds.forEach((fileId) => {
      //     editFile(fileId, { card_pk: response.id });
      //   });
      // }
      navigate(`/app/card/${response.id}`);
    } else {
      setError("Unable to save card, something has gone wrong.");
    }
    setRefreshPartialCards(true);
  }

  useEffect(() => {
    if (!newCard) {
      fetchCard(id!);
    } else {
      setEditingCard({ ...defaultCard, card_id: lastCardId });
    }
  }, [id]);

  function handleCancelButtonClick() {
    if (editingCard.id) {
      navigate(`/app/card/${editingCard.id}`);
    } else {
      navigate("/");
    }
  }

  function handleDeleteButtonClick() {
    if (
      window.confirm(
        "Are you sure you want to delete this card? This cannot be reversed"
      )
    ) {
      deleteCard(editingCard.id)
        .then(() => setRefreshPartialCards(true))
        .catch((error) =>
          setMessage(
            "Unable to delete card. Does it have backlinks, children or files?"
          )
        );
    }
  }

  function handleBodyChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditingCard({ ...editingCard, body: event.target.value });
  }

  const handleDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        try {
          const response = await uploadFile(files[i], editingCard.id);
          if ("error" in response) {
            setMessage("Error uploading file: " + response["message"]);
          } else {
            setMessage(
              "File uploaded successfully: " + response["file"]["name"]
            );
            addFileId(response["file"]["id"].toString());
          }
        } catch (error) {
          setMessage("Error uploading file: " + error);
        }
      }
    }
  };

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    event.preventDefault();

    if (event.clipboardData && event.clipboardData.items) {
      const items = Array.from(event.clipboardData.items);
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();

          if (newCard) {
            setMessage(
              "Error: Cannot upload images for new cards, please save the card first"
            );
            return;
          }

          try {
            const response = await uploadFile(file!, editingCard.id);

            if ("error" in response) {
              setMessage("Error uploading file: " + response["message"]);
            } else {
              let append_text = "\n\n![](" + response["file"]["id"] + ")";
              setMessage(
                `File uploaded successfully: ${response["file"]["name"]}`
              );

              setEditingCard((prevEditingCard) => ({
                ...prevEditingCard,
                body: prevEditingCard.body + append_text,
              }));
            }
          } catch (error) {
            setMessage(`Error uploading file: ${error}`);
          }
        } else if (item.type === "text/plain") {
          const text = event.clipboardData.getData("text/plain");
          setEditingCard((prevEditingCard) => ({
            ...prevEditingCard,
            body: prevEditingCard.body + text,
          }));
        }
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
  };

  function addBacklink(selectedCard: PartialCard) {
    let text = "";
    if (selectedCard) {
      text = "\n\n[" + selectedCard.card_id + "] - " + selectedCard.title;
    } else {
      text = "";
    }
    setEditingCard((prevEditingCard) => ({
      ...prevEditingCard,
      body: prevEditingCard.body + text,
    }));
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
              style={{ display: "block", marginBottom: "10px" }}
            />
            {newCard && renderWarningLabel(partialCards, editingCard)}
          </div>
          <label htmlFor="title">Title:</label>
          <input
            style={{ display: "block", width: "100%", marginBottom: "10px" }}
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
            style={{ display: "block", width: "100%", height: "200px" }}
            className="border-2 p-2"
            id="body"
            value={editingCard.body}
            onChange={handleBodyChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
            placeholder="Body"
          />
          <div>
            <BacklinkInput addBacklink={addBacklink} />
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
          <Button onClick={handleSaveCard} children={"Save"} />
          <Button onClick={handleCancelButtonClick} children={"Cancel"} />
          {!newCard && (
            <Button onClick={handleDeleteButtonClick} children={"Delete"} />
          )}
          {!newCard && (
            <div>
              <h4>Files:</h4>
              <ul>
                {editingCard.files.map((file, index) => (
                  <FileListItem
                    key={index}
                    file={file}
                    onDelete={onFileDelete}
                    handleViewCard={handleViewCard}
                    openRenameModal={openRenameModal}
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
