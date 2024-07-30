import React, { useState, useEffect } from "react";
import { isCardIdUnique } from "../../utils";
import { uploadFile } from "../../api/files";
import { saveNewCard, saveExistingCard, getCard } from "../../api/cards";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { useNavigate, useParams } from "react-router-dom";
import { Card, PartialCard, defaultCard } from "../../models/Card";
import { File } from "../../models/File";
import { usePartialCardContext } from "../../contexts/CardContext";
import { Button } from "../../components/Button";
import { ButtonCardDelete } from "../../components/cards/ButtonCardDelete";
import { CardBodyTextArea } from "../../components/cards/CardBodyTextArea";

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
  const { partialCards, setRefreshPartialCards } = usePartialCardContext();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
          <CardBodyTextArea
            editingCard={editingCard}
            setEditingCard={setEditingCard}
            setMessage={setMessage}
            newCard={newCard}
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
            <ButtonCardDelete card={editingCard} setMessage={setMessage} />
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
                    setRefreshFiles={(refresh: boolean) => {}}
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
