import React, { useState, useEffect } from "react";
import { CardBody } from "../../components/cards/CardBody";
import { CardItem } from "../../components/cards/CardItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { getCard, saveExistingCard, pinCard, unpinCard } from "../../api/cards";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Card, PartialCard, Entity } from "../../models/Card";
import { isErrorResponse } from "../../models/common";
import { TaskListItem } from "../../components/tasks/TaskListItem";
import { useTaskContext } from "../../contexts/TaskContext";
import { useFileContext } from "../../contexts/FileContext";

import { Button } from "../../components/Button";
import { HeaderTop, HeaderSubSection } from "../../components/Header";
import { linkifyWithDefaultOptions } from "../../utils/strings";
import { convertCardToPartialCard } from "../../utils/cards";
import { ViewCardTabbedDisplay } from "../../components/cards/ViewCardTabbedDisplay";

import { usePartialCardContext } from "../../contexts/CardContext";
import { useCardRefresh } from "../../contexts/CardRefreshContext";
import { findNextChildId } from "../../utils/cards";

import { useShortcutContext } from "../../contexts/ShortcutContext";
import { useTagContext } from "../../contexts/TagContext";

import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";
import { FileUpload } from "../../components/files/FileUpload";

import { ChildrenCards } from "../../components/cards/ChildrenCards";
import { EntityDialog } from "../../components/entities/EntityDialog";
import { compareCardIds } from "../../utils/cards";

import { CardList } from "../../components/cards/CardList";

interface ViewPageProps { }

export function ViewPage({ }: ViewPageProps) {
  const [error, setError] = useState("");
  const [viewingCard, setViewCard] = useState<Card | null>(null);
  const [parentCard, setParentCard] = useState<Card | null>(null);
  const { refreshTasks, setRefreshTasks } = useTaskContext();
  const { refreshFiles } = useFileContext();
  const { id } = useParams<{ id: string }>();
  const { refreshTrigger } = useCardRefresh();

  const fileUploadRef = React.useRef<HTMLInputElement>(null);

  const {
    showCreateTaskWindow,
    setShowCreateTaskWindow,
  } = useShortcutContext();

  const { tags } = useTagContext();
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isEntityDialogOpen, setEntityDialogOpen] = useState(false);

  const navigate = useNavigate();

  const { setLastCard, setNextCardId } = usePartialCardContext();

  async function handleTagClick(tagName: string) {
    setShowTagMenu(false);
    if (viewingCard === null) {
      return;
    }

    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + "\n\n#" + tagName,
    };
    let response = await saveExistingCard(editedCard);
    setViewCard(editedCard);
  }

  async function handleRemoveTag(tagName: string) {
    if (viewingCard === null) {
      return;
    }

    const tagRegex = new RegExp(`\\n*#${tagName}\\b`, 'g');
    let editedCard = {
      ...viewingCard,
      body: viewingCard.body.replace(tagRegex, ''),
    };
    let response = await saveExistingCard(editedCard);
    setViewCard(editedCard);
    fetchCard(id!);
  }

  async function handleAddBacklink(selectedCard: PartialCard) {
    if (viewingCard === null) {
      return;
    }
    let text = "";
    if (selectedCard) {
      text = "\n\n[" + selectedCard.card_id + "] - " + selectedCard.title;
    } else {
      text = "";
    }
    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + text,
    };
    let response = await saveExistingCard(editedCard);
    setViewCard(editedCard);
    fetchCard(id!);
  }

  function toggleTagMenu() {
    setShowTagMenu(true);
  }


  function handleEditCard() {
    if (viewingCard === null) {
      return;
    }
    navigate(`/app/card/${viewingCard.id}/edit`);
  }

  function handleCreateChildCard() {
    if (viewingCard === null) return;
    const nextId = findNextChildId(viewingCard.card_id, viewingCard.children);
    setNextCardId(nextId);
    navigate('/app/card/new');
  }

  async function fetchCard(id: string) {
    try {
      let refreshed = await getCard(id);

      if (isErrorResponse(refreshed)) {
        setError(refreshed["error"]);
      } else {
        setViewCard(refreshed);
        document.title = "Zettelgarden - " + refreshed.card_id + " - View";
        setLastCard(convertCardToPartialCard(refreshed));

        if (refreshed.parent && "id" in refreshed.parent) {
          let parentCardId = refreshed.parent.id;
          const parentCard = await getCard(parentCardId.toString());
          setParentCard(parentCard);
        } else {
          setParentCard(null);
        }
      }
    } catch (error: any) {
      setError(error.message);
    }
  }
  const handleTogglePin = async () => {
    if (viewingCard === null) {
      return
    }
    console.log("?", viewingCard)
    const card = viewingCard
    try {
      console.log(viewingCard, viewingCard.is_pinned)
      if (viewingCard.is_pinned) {
        await unpinCard(viewingCard.id);
        setViewCard({
          ...card,
          is_pinned: false
        })
      } else {
        await pinCard(viewingCard.id);
        setViewCard({
          ...card,
          is_pinned: true
        })
      }
    } catch (error) {
      console.log(error);
    }
  };

  function toggleCreateTaskWindow() {
    setShowCreateTaskWindow(!showCreateTaskWindow);
  }

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightEntities(text: string, entities: Entity[] | null | undefined): string {
    if (!entities || entities.length === 0) return text;
    let processed = text;
    entities.forEach(entity => {
      const escapedName = escapeRegex(entity.name);
      const regex = new RegExp(`(${escapedName})`, "gi");
      processed = processed.replace(
        regex,
        `<span class="bg-yellow-200 cursor-pointer hover:bg-yellow-300" data-entity="${entity.id}">$1</span>`
      );
    });
    return processed;
  }

  function handleEntityClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const entityId = target.getAttribute("data-entity");
    if (entityId && viewingCard) {
      const entity = viewingCard.entities.find(ent => ent.id === Number(entityId));
      if (entity) {
        setSelectedEntity(entity);
        setEntityDialogOpen(true);
      }
    }
  }

  // For initial fetch and when id changes
  useEffect(() => {
    setError("");
    fetchCard(id!);
  }, [id, refreshTasks, refreshFiles, refreshTrigger]);

  return (
    <div className="max-w-3/4 mx-auto px-4 py-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}
      {viewingCard && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white rounded-lg p-3 shadow-sm">
            <div className="flex-grow">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-blue-600">
                  [{viewingCard.card_id}]
                </span>
                <span className="text-gray-600">:</span>
                <h1 className="text-lg font-bold">
                  {viewingCard.title}
                </h1>
              </div>
            </div>
            <div className="mt-2 md:mt-0 md:ml-4 flex gap-2">
              <Button onClick={handleEditCard}>Edit</Button>
            </div>
          </div>

          <div>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Card Body */}
              <div className="md:w-2/3 space-y-4">
                <div
                  className="bg-white rounded-lg p-6 prose shadow-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: highlightEntities(viewingCard.body, viewingCard.entities),
                  }}
                  onClick={handleEntityClick}
                />


                <div>
                  {viewingCard.children.length > 0 && (
                    <div>
                      <HeaderSubSection text="Children" />
                      <ChildrenCards
                        allChildren={viewingCard.children.sort((a, b) =>
                          compareCardIds(a.card_id, b.card_id),
                        )}
                        card={viewingCard}
                      />
                      <hr />
                      {selectedEntity && (
        <EntityDialog
          entity={selectedEntity}
          isOpen={isEntityDialogOpen}
          onClose={() => setEntityDialogOpen(false)}
        />
      )}
    </div>
                  )}
                </div>
                <div>
                  {viewingCard.references.length > 0 && (
                    <div>
                      <HeaderSubSection text="References" />
                      <CardList
                        cards={viewingCard.references.sort((a, b) =>
                          compareCardIds(a.card_id, b.card_id),
                        )}
                      />
                      <hr />
                    </div>
                  )}
                </div>
                {/* Tasks Section */}
                {viewingCard.tasks.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <HeaderSubSection text="Tasks" />
                    <div className="mt-2 space-y-2">
                      {viewingCard.tasks.map((task, index) => (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          onTagClick={(tag: string) => { }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabbed Display */}
                <div className="bg-white rounded-lg shadow-sm">
                  <ViewCardTabbedDisplay
                    viewingCard={viewingCard}
                    setViewCard={setViewCard}
                    setError={setError}
                  />
                </div>

              </div>

              {/* Backlink and Options Section */}
              <div className="md:w-1/3 bg-white rounded-lg p-4 shadow-sm space-y-4">


                {parentCard && (
                  <div>
                    <span className="font-bold">Parent</span>
                    <CardItem card={parentCard} />
                    <hr />
                  </div>
                )}
                <div>
                  <div>
                    <HeaderSubSection text="Tags" />
                    <div className="flex flex-wrap gap-1.5">
                      {viewingCard.tags.map((tag) => (
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
                          {viewingCard.body.includes(`#${tag.name}`) && (
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
                    <Button onClick={toggleTagMenu}>Add Tags</Button>

                    <hr />
                    {showTagMenu && (
                      <SearchTagDropdown
                        tags={tags}
                        handleTagClick={handleTagClick}
                        setShowTagMenu={setShowTagMenu}
                      />
                    )}
                  </div>
                </div>

                {viewingCard.link && (
                  <div>
                    <span className="font-bold">Link</span>
                    <div className="px-2.5 py-2">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: linkifyWithDefaultOptions(viewingCard.link),
                        }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <BacklinkInput addBacklink={handleAddBacklink} />
                </div>
                <div>
                  <Button onClick={handleCreateChildCard}>Add Child Card</Button>
                </div>
                <div>
                  <Button onClick={toggleCreateTaskWindow}>Add Task</Button>
                </div>
                <div>
                  <Button onClick={() => {
                    if (fileUploadRef.current) {
                      fileUploadRef.current.click();
                    }
                  }}>Upload File</Button>

                  <FileUpload
                    ref={fileUploadRef}
                    setMessage={setError}
                    card={viewingCard}
                  />
                </div>

                <div>
                  {viewingCard && viewingCard.is_pinned ? (
                    <Button onClick={handleTogglePin}>Unpin Card</Button>

                  ) : (
                    <Button onClick={handleTogglePin}>Pin Card</Button>

                  )}

                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Created At:</span>
                    <span> {viewingCard.created_at.toISOString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Updated At:</span>
                    <span> {viewingCard.updated_at.toISOString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link Section */}

          </div>
        </div>
      )}
    </div>
  );
}
