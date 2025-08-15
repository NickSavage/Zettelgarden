import React, { useState, useEffect, useRef } from "react";
import { isCardIdUnique } from "../../utils/cards";
import { uploadFile } from "../../api/files";
import { parseURL } from "../../api/references";
import { saveNewCard, saveExistingCard, getCard, getNextRootId } from "../../api/cards";
import { editFile } from "../../api/files";
import { getTemplates } from "../../api/templates";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkDialog } from "../../components/cards/BacklinkDialog";
import { useNavigate, useParams } from "react-router-dom";
import { Card, PartialCard, defaultCard, CardTemplate } from "../../models/Card";
import { File } from "../../models/File";
import { usePartialCardContext } from "../../contexts/CardContext";
import { Button } from "../../components/Button";
import { ButtonCardDelete } from "../../components/cards/ButtonCardDelete";
import { CardBodyTextArea, CardBodyTextAreaHandle } from "../../components/cards/CardBodyTextArea";
import { MarkdownToolbar } from "../../components/cards/MarkdownToolbar";
import { SaveAsTemplateDialog } from "../../components/cards/SaveAsTemplateDialog";
import { TemplateVariablesHelp } from "../../components/templates/TemplateVariablesHelp";
import { processTemplateVariables } from "../../utils/templateVariables";

import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { useTagContext } from "../../contexts/TagContext";
import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";
import { HeaderSubSection } from "../../components/Header";
import { setDocumentTitle } from "../../utils/title";

interface EditPageProps {
  newCard: boolean;
}

function onFileDelete(file_id: number) { }

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
  const [editingCard, setEditingCard] = useState<Card>(defaultCard);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [showBacklinkDialog, setShowBacklinkDialog] = useState(false);
  const [previewModeActive, setPreviewModeActive] = useState(false); // Added for preview toggle
  const { partialCards, setRefreshPartialCards, lastCard, nextCardId, setNextCardId } =
    usePartialCardContext();
  const [filesToUpdate, setFilesToUpdate] = useState<File[]>([]);
  const cardBodyRef = useRef<CardBodyTextAreaHandle>(null);

  // Template selector state
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const { tags } = useTagContext();
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  const [fileFilterString, setFileFilterString] = useState<string>("");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch templates
  useEffect(() => {
    if (newCard) {
      fetchTemplates();
    }
  }, [newCard]);

  async function fetchTemplates() {
    try {
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      setLoadingTemplates(false);
    } catch (err) {
      setTemplateError("Failed to load templates");
      setLoadingTemplates(false);
    }
  }

  function handleSelectTemplate(template: CardTemplate) {
    // Process template variables in both title and body
    const processedTitle = processTemplateVariables(template.title);
    const processedBody = processTemplateVariables(template.body);

    setEditingCard(prevCard => ({
      ...prevCard,
      title: processedTitle,
      body: processedBody
    }));
    setMessage("Template applied successfully");
    setShowTemplateDropdown(false);
  }

  async function fetchCard(id: string) {
    let refreshed = await getCard(id);
    setEditingCard(refreshed);
    setDocumentTitle(refreshed.card_id + " - Edit")
  }

  // clear draft on save
  async function handleSaveCard() {
    let response;
    if (newCard) {
      response = await saveNewCard(editingCard);
    } else {
      response = await saveExistingCard(editingCard);
    }

    if (!("error" in response)) {
      if (newCard) {
        localStorage.removeItem('newCardBodyDraft');
      }
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

  // on mount, restore draft if newCard
  useEffect(() => {
    if (!newCard) {
      fetchCard(id!);
    } else {
      setDocumentTitle("New Card");
      const draft = localStorage.getItem('newCardBodyDraft') || "";
      setEditingCard({
        ...defaultCard,
        card_id: nextCardId || (lastCard ? lastCard.card_id : ""),
        body: draft
      });
      if (nextCardId) {
        setNextCardId(null);
      }
    }
  }, [id]);

  // clear draft on cancel
  function handleCancelButtonClick() {
    if (newCard) {
      localStorage.removeItem('newCardBodyDraft');
      console.log(lastCard);
      if (lastCard) {
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
    setShowTagMenu(false);
    setEditingCard((prevEditingCard) => ({
      ...prevEditingCard,
      body: prevEditingCard.body + "\n\n#" + tagName,
    }));
  }

  function handleRemoveTag(tagName: string) {
    const tagRegex = new RegExp(`\\n*#${tagName}\\b`, 'g');
    setEditingCard((prevEditingCard) => ({
      ...prevEditingCard,
      body: prevEditingCard.body.replace(tagRegex, ''),
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
    <div className="px-4 md:px-20 py-8 max-w-3/4 mx-auto">
      {editingCard && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-2/3 space-y-6">
            {(message || error) && (
              <div className={`p-4 rounded-md ${error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                {message || error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="card_id" className="block text-sm font-medium text-gray-700">
                Card ID:
                <span className="ml-2 inline-block text-gray-500 hover:text-gray-700 cursor-help" title="Card IDs follow a hierarchical structure (e.g., 'A.1/B' or '104/A.6'). Numbers and letters alternate in the hierarchy. After a number comes a letter (A.1/A), after a letter comes a number (A.1/A.1). IDs must be unique.">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.25 3a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" />
                  </svg>
                </span>
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
              <MarkdownToolbar
                onFormatText={(formatType) => {
                  cardBodyRef.current?.formatText(formatType);
                }}
                onBacklinkClick={() => setShowBacklinkDialog(true)}
                onTogglePreview={() => {
                  cardBodyRef.current?.togglePreviewMode();
                  setPreviewModeActive(prev => !prev);
                }}
                isPreviewActive={previewModeActive}
              />
              <CardBodyTextArea
                ref={cardBodyRef}
                editingCard={editingCard}
                setEditingCard={(card) => {
                  setEditingCard(card);
                  console.log("saving", newCard)
                  if (newCard) {
                    localStorage.setItem('newCardBodyDraft', card.body);
                  }
                }}
                setMessage={setMessage}
                newCard={newCard}
                filesToUpdate={filesToUpdate}
                setFilesToUpdate={setFilesToUpdate}
              />
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

            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={handleSaveCard} variant="primary">Save</Button>
              <Button onClick={handleCancelButtonClick} variant="outline">Cancel</Button>
              {!newCard && (
                <ButtonCardDelete card={editingCard} setMessage={setMessage} />
              )}
            </div>

            {showBacklinkDialog && (
              <BacklinkDialog
                onClose={() => setShowBacklinkDialog(false)}
                onSelect={addBacklink}
                setMessage={setMessage}
              />
            )}

            {showSaveAsTemplate && (
              <SaveAsTemplateDialog
                body={editingCard.body}
                title={editingCard.title}
                onClose={() => setShowSaveAsTemplate(false)}
                onSuccess={setMessage}
              />
            )}

            {!newCard && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Files:</h4>
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                  {editingCard.files.map((file, index) => (
                    <FileListItem
                      key={index}
                      file={file}
                      onDelete={onFileDelete}
                      setRefreshFiles={(refresh: boolean) => { }}
                      displayFileOnCard={(file: File) =>
                        handleDisplayFileOnCardClick(file)
                      }
                      filterString={fileFilterString}
                      setFilterString={setFileFilterString}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="md:w-1/3 bg-white rounded-lg p-4 shadow-sm">

            {newCard && (
              <div className="mb-6">
                {loadingTemplates ? (
                  <div>Loading templates...</div>
                ) : templateError ? (
                  <div className="text-red-600">{templateError}</div>
                ) : templates.length === 0 ? null : (
                  <div className="relative">
                    <Button
                      onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      variant="primary"
                      size="medium"
                    >
                      Use Template
                    </Button>

                    {showTemplateDropdown && (
                      <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {templates.map((template) => (
                            <button
                              key={template.id}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => handleSelectTemplate(template)}
                            >
                              {template.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSaveAsTemplate(true)}
                variant="secondary"
              >
                Save as Template
              </Button>
              <TemplateVariablesHelp />
            </div>
            <div className="py-2">
              <BacklinkInput addBacklink={addBacklink} />
            </div>
            <div>
              <HeaderSubSection text="Tags" />
              <div className="flex flex-wrap gap-1.5">
                {editingCard.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full"
                  >
                    <span
                      className="cursor-pointer hover:bg-purple-100"
                      onClick={() => navigate(`/app/search?term=${encodeURIComponent('#' + tag.name)}`)}
                    >
                      #{tag.name}
                    </span>
                    {editingCard.body.includes(`#${tag.name}`) && (
                      <button
                        onClick={() => handleRemoveTag(tag.name)}
                        className="ml-1.5 text-purple-400 hover:text-purple-600"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Button onClick={() => setShowTagMenu(true)}>Add Tags</Button>
              {showTagMenu && (
                <SearchTagDropdown
                  tags={tags}
                  handleTagClick={handleTagClick}
                  setShowTagMenu={setShowTagMenu}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
