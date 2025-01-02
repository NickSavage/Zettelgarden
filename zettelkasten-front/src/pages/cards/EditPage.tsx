import React, { useState, useEffect } from "react";
import { isCardIdUnique } from "../../utils/cards";
import { uploadFile } from "../../api/files";
import { parseURL } from "../../api/references";
import { saveNewCard, saveExistingCard, getCard, getNextRootId } from "../../api/cards";
import { editFile } from "../../api/files";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { useNavigate, useParams } from "react-router-dom";
import { Card, PartialCard, defaultCard } from "../../models/Card";
import { File } from "../../models/File";
import { usePartialCardContext } from "../../contexts/CardContext";
import { Button } from "../../components/Button";
import { ButtonCardDelete } from "../../components/cards/ButtonCardDelete";
import { CardBodyTextArea } from "../../components/cards/CardBodyTextArea";
import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { useTagContext } from "../../contexts/TagContext";

interface EditPageProps {
  newCard: boolean;
}

function handleViewCard(card_pk: number) {}
function openRenameModal(file: File) {}
function onFileDelete(file_id: number) {}

function renderWarningLabel(cards: PartialCard[], editingCard: Card) {
  if (!editingCard.card_id) return null;
  if (!isCardIdUnique(cards, editingCard.card_id)) {
    return <span className="text-red-600 text-sm font-medium">Card ID is not unique!</span>;
  }
  return null;
}

export function EditPage({ newCard }: EditPageProps) {
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [editingCard, setEditingCard] = useState<Card>(defaultCard);
  const { partialCards, setRefreshPartialCards, lastCard } =
    usePartialCardContext();
  const [filesToUpdate, setFilesToUpdate] = useState<File[]>([]);
  const { tags } = useTagContext();

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
      filesToUpdate.map((file) =>
        editFile(file["id"].toString(), {
          name: file.name,
          card_pk: response.id,
        }),
      );

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
      setEditingCard({
        ...defaultCard,
        card_id: lastCard ? lastCard.card_id : "",
      });
    }
  }, [id]);

  function handleCancelButtonClick() {
    if (newCard) {
      console.log("we get here?");
      console.log(lastCard);
      if (lastCard) {
        console.log("?");
        navigate(`/app/card/${lastCard.id}`);
      } else {
        navigate(`/`);
      }
    } else {
      if (editingCard.id) {
        navigate(`/app/card/${editingCard.id}`);
      } else {
        navigate(`/`);
      }
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
  function handleTagClick(tagName: string) {
    setEditingCard((prevEditingCard) => ({
      ...prevEditingCard,
      body: prevEditingCard.body + "\n\n#" + tagName,
    }));
  }

  async function handleClickFillCard() {
    if (!editingCard.link) {
      // Handle case where there's no link
      console.log("No link provided");
      return;
    }

    try {
      const result = await parseURL(editingCard.link);
      let body =
        // Assuming you have a function to update the card
        setEditingCard((prev) => ({
          ...prev,
          // Only update title if it's empty/blank
          title:
            !prev.title || prev.title.trim() === "" ? result.title : prev.title,
          // Only update body if it's empty/blank
          body:
            !prev.body || prev.body.trim() === "" ? result.content : prev.body,
        }));
    } catch (error) {
      console.error("Failed to parse URL:", error);
      // Handle error - maybe show a notification to the user
    }
  }

  async function handleDisplayFileOnCardClick(file: File) {
    setEditingCard((prevEditingCard) => ({
      ...prevEditingCard,
      body: prevEditingCard.body + "\n\n![](" + file.id + ")",
    }));
  }

  return (
    <div className="px-4 md:px-20 py-8 max-w-4xl mx-auto">
      {editingCard && (
        <div className="space-y-6">
          {(message || error) && (
            <div className={`p-4 rounded-md ${
              error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {message || error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="card_id" className="block text-sm font-medium text-gray-700">
              Card ID:
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  id="card_id"
                  value={editingCard.card_id}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, card_id: e.target.value })
                  }
                  placeholder="ID"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-24"
                />
                {newCard && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await getNextRootId();
                        if (!response.error) {
                          setEditingCard({ ...editingCard, card_id: response.new_id });
                        }
                      } catch (error) {
                        console.error("Failed to get next ID:", error);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                    type="button"
                  >
                    Get Next ID
                  </button>
                )}
              </div>
              {newCard && renderWarningLabel(partialCards, editingCard)}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title:
            </label>
            <input
              type="text"
              id="title"
              value={editingCard.title}
              onChange={(e) =>
                setEditingCard({ ...editingCard, title: e.target.value })
              }
              placeholder="Title"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              Body:
            </label>
            <CardBodyTextArea
              editingCard={editingCard}
              setEditingCard={setEditingCard}
              setMessage={setMessage}
              newCard={newCard}
              filesToUpdate={filesToUpdate}
              setFilesToUpdate={setFilesToUpdate}
            />
            <div className="flex gap-3 mt-2">
              <div className="flex-1">
                <BacklinkInput addBacklink={addBacklink} />
              </div>
              <div className="flex-1">
                <SearchTagMenu tags={tags} handleTagClick={handleTagClick} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="link" className="block text-sm font-medium text-gray-700">
              Source/URL:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="link"
                value={editingCard.link}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, link: e.target.value })
                }
                placeholder="Source/URL"
                className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <Button 
                onClick={handleClickFillCard}
                variant="secondary"
                size="medium"
                className="whitespace-nowrap"
              >
                Fill Card From URL
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveCard} variant="primary">Save</Button>
            <Button onClick={handleCancelButtonClick} variant="outline">Cancel</Button>
            {!newCard && (
              <ButtonCardDelete card={editingCard} setMessage={setMessage} />
            )}
          </div>

          {!newCard && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Files:</h4>
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                {editingCard.files.map((file, index) => (
                  <FileListItem
                    key={index}
                    file={file}
                    onDelete={onFileDelete}
                    setRefreshFiles={(refresh: boolean) => {}}
                    displayFileOnCard={(file: File) =>
                      handleDisplayFileOnCardClick(file)
                    }
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
