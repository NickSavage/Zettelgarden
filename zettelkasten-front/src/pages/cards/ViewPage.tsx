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

import { Button } from "../../components/Button";
import { HeaderTop, HeaderSubSection } from "../../components/Header";
import { linkifyWithDefaultOptions } from "../../utils/strings";
import { convertCardToPartialCard } from "../../utils/cards";
import { ViewCardTabbedDisplay } from "../../components/cards/ViewCardTabbedDisplay";

import { ViewCardOptionsMenu } from "../../components/cards/ViewCardOptionsMenu";
import { usePartialCardContext } from "../../contexts/CardContext";

interface ViewPageProps {}

export function ViewPage({}: ViewPageProps) {
  const [error, setError] = useState("");
  const [viewingCard, setViewCard] = useState<Card | null>(null);
  const [parentCard, setParentCard] = useState<Card | null>(null);
  const { tasks, setRefreshTasks } = useTaskContext();
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { setLastCard } = usePartialCardContext();

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
    setRefreshTasks(true);
  }, [id, setRefreshTasks]);

  return (
    <div className="px-4 md:px-20 py-4">
      {error && (
        <div>
          // <h3>Unauthorized</h3>
          <div>{error}</div>
        </div>
      )}
      {viewingCard && (
        <div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex-grow">
              <span className="font-bold text-blue-600">
                {viewingCard.card_id}
              </span>
              <HeaderTop text=": " />
              <HeaderTop className="pr-2" text={viewingCard.title} />
              {viewingCard.tags.length > 0 &&
                viewingCard.tags.map((tag) => (
                  <span className="pl-2 text-purple-500 text-sm">
                    #{tag.name}
                  </span>
                ))}
            </div>
            <div className="p-2">
              <Button onClick={handleEditCard} children="Edit" />
            </div>
          </div>

          <hr />
          <div className="p-4">
            <CardBody viewingCard={viewingCard} />
          </div>
          <div>
            {viewingCard.link && (
              <div>
                <span style={{ fontWeight: "bold" }}>{"Link: "}</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: linkifyWithDefaultOptions(viewingCard.link),
                  }}
                />
              </div>
            )}
          </div>
          <hr />
          <div className="py-4">
            <div className="flex align-center pb-2 pr-2">
              <BacklinkInput addBacklink={handleAddBacklink} />
              <ViewCardOptionsMenu
                viewingCard={viewingCard}
                setViewCard={setViewCard}
                setMessage={setError}
              />
            </div>
            <div className="text-xs">
              <span className="font-bold">Created At:</span>
              <span> {viewingCard.created_at.toISOString()}</span>
              <br />
              <span className="font-bold">Updated At:</span>
              <span> {viewingCard.updated_at.toISOString()}</span>
            </div>
          </div>
          {parentCard && (
            <div>
              <HeaderSubSection text="Parent" />
              <ul>
                <CardItem card={parentCard} />
              </ul>
            </div>
          )}
          <hr />
          {viewingCard.tasks.length > 0 && (
            <div>
              <HeaderSubSection text="Tasks" />
              {viewingCard.tasks.map((task, index) => (
                <TaskListItem
                  task={task}
                  setRefresh={setRefreshTasks}
                  onTagClick={(tag: string) => {}}
                />
              ))}
              <hr />
            </div>
          )}
          <ViewCardTabbedDisplay
            viewingCard={viewingCard}
            setViewCard={setViewCard}
            setError={setError}
          />
        </div>
      )}
    </div>
  );
}
