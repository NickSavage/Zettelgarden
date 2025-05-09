import React, { useState, useEffect } from "react";
import { CardBody } from "../../components/cards/CardBody";
import { CardItem } from "../../components/cards/CardItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { getCard, saveExistingCard } from "../../api/cards";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Card, PartialCard } from "../../models/Card";
import { isErrorResponse } from "../../models/common";
import { TaskListItem } from "../../components/tasks/TaskListItem";
import { useTaskContext } from "../../contexts/TaskContext";
import { useFileContext } from "../../contexts/FileContext";

import { Button } from "../../components/Button";
import { HeaderTop, HeaderSubSection } from "../../components/Header";
import { linkifyWithDefaultOptions } from "../../utils/strings";
import { convertCardToPartialCard } from "../../utils/cards";
import { ViewCardTabbedDisplay } from "../../components/cards/ViewCardTabbedDisplay";

import { ViewCardOptionsMenu } from "../../components/cards/ViewCardOptionsMenu";
import { usePartialCardContext } from "../../contexts/CardContext";
import { useCardRefresh } from "../../contexts/CardRefreshContext";
import { findNextChildId } from "../../utils/cards";

interface ViewPageProps { }

export function ViewPage({ }: ViewPageProps) {
  const [error, setError] = useState("");
  const [viewingCard, setViewCard] = useState<Card | null>(null);
  const [parentCard, setParentCard] = useState<Card | null>(null);
  const { refreshTasks, setRefreshTasks } = useTaskContext();
  const { refreshFiles } = useFileContext();
  const { id } = useParams<{ id: string }>();
  const { refreshTrigger } = useCardRefresh();

  const navigate = useNavigate();

  const { setLastCard, setNextCardId } = usePartialCardContext();

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

  // For initial fetch and when id changes
  useEffect(() => {
    setError("");
    fetchCard(id!);
  }, [id, refreshTasks, refreshFiles, refreshTrigger]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
                {viewingCard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {viewingCard.tags.map((tag) => (
                      <span
                        key={tag.name}
                        className="inline-flex items-center px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full cursor-pointer hover:bg-purple-100"
                        onClick={() => navigate(`/app/search?term=${encodeURIComponent('#' + tag.name)}`)}
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 md:mt-0 md:ml-4 flex gap-2">
              <Button onClick={handleEditCard}>Edit</Button>
              <Button onClick={handleCreateChildCard}>Add Child Card</Button>
            </div>
          </div>

          {/* Card Body */}
          <div className="bg-white rounded-lg p-6 prose shadow-sm max-w-none">
            <CardBody viewingCard={viewingCard} />
          </div>

          {/* Link Section */}
          {viewingCard.link && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <span className="font-medium">Link: </span>
              <span
                dangerouslySetInnerHTML={{
                  __html: linkifyWithDefaultOptions(viewingCard.link),
                }}
              />
            </div>
          )}

          {/* Backlink and Options Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <BacklinkInput addBacklink={handleAddBacklink} />
              <ViewCardOptionsMenu
                viewingCard={viewingCard}
                setViewCard={setViewCard}
                setMessage={setError}
                onEdit={handleEditCard}
              />
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

          {/* Parent Card Section */}
          {parentCard && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <HeaderSubSection text="Parent" />
              <ul className="mt-2">
                <CardItem card={parentCard} />
              </ul>
            </div>
          )}

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
      )}
    </div>
  );
}
