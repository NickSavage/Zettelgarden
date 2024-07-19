import React, { useState, useEffect } from "react";
import { CardBody } from "../components/cards/CardBody";
import { CardItem } from "../components/cards/CardItem";
import { CardList } from "../components/cards/CardList";
import { FileListItem } from "../components/FileListItem";
import { BacklinkInput } from "../components/cards/BacklinkInput";
import { getCard, saveExistingCard } from "../api/cards";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Card, PartialCard } from "../models/Card";
import { File } from "../models/File";
import { isErrorResponse } from "../models/common";
import { TaskListItem } from "src/components/tasks/TaskListItem";
import { CreateTaskWindow } from "src/components/tasks/CreateTaskWindow";
import { useTaskContext } from "src/contexts/TaskContext";

interface ViewPageProps {
  setLastCardId: (cardId: string) => void;
}

export function ViewPage({ setLastCardId }: ViewPageProps) {
  const [error, setError] = useState("");
  const [viewingCard, setViewCard] = useState<Card | null>(null);
  const [parentCard, setParentCard] = useState<Card | null>(null);
  const { tasks, setRefreshTasks } = useTaskContext();
  const [showCreateTaskWindow, setShowCreateTaskWindow] =
    useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const cardId = id ? parseInt(id, 10) : null;
  const cardTasks = cardId 
    ? tasks.filter((task) => task.card_pk === cardId)
    : [];

  const navigate = useNavigate();

  function onFileDelete(file_id: number) {}
  function handleViewCard(card_id: number) {}
  function openRenameModal(file: File) {}

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
        setLastCardId(refreshed.card_id);

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

  function toggleCreateTaskWindow() {
    setShowCreateTaskWindow(!showCreateTaskWindow);
  }

  // For initial fetch and when id changes
  useEffect(() => {
    setError("");
    fetchCard(id!);
    setRefreshTasks(true);
  }, [id, setRefreshTasks]);

  return (
    <div>
      {error && (
        <div>
          <h3>Unauthorized</h3>
          <div>{error}</div>
        </div>
      )}
      {viewingCard && (
        <div>
          <h3 style={{ marginBottom: "10px" }}>
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {viewingCard.card_id}
            </span>
            <span>: {viewingCard.title}</span>
          </h3>
          <hr />
          <div>
            <CardBody viewingCard={viewingCard} />
          </div>
          <div>
            {viewingCard.link && (
              <div>
                <span style={{ fontWeight: "bold" }}>Link:</span>
                <span>{viewingCard.link}</span>
              </div>
            )}
          </div>
          <hr />
          <p>Created At: {viewingCard.created_at}</p>
          <p>Updated At: {viewingCard.updated_at}</p>
          <hr />
          {parentCard && (
            <div>
              <h4>Parent:</h4>
              <ul>
                <CardItem card={parentCard} />
              </ul>
            </div>
          )}
          <h4>Files:</h4>
          <ul>
            {viewingCard.files.map((file, index) => (
              <FileListItem
                file={file}
                onDelete={onFileDelete}
                handleViewCard={handleViewCard}
                openRenameModal={openRenameModal}
              />
            ))}
          </ul>
          <h4>Tasks</h4>
          <span onClick={toggleCreateTaskWindow}>Add Task</span>
          {showCreateTaskWindow && (
            <CreateTaskWindow
              currentCard={viewingCard}
              setRefresh={setRefreshTasks}
              setShowTaskWindow={setShowCreateTaskWindow}
            />
          )}
          {cardTasks.map((task, index) => (
            <TaskListItem task={task} setRefresh={setRefreshTasks} />
          ))}

          <h4>References:</h4>
          <CardList cards={viewingCard.references} />
          <div>
            <BacklinkInput addBacklink={handleAddBacklink} />
          </div>
          <button onClick={handleEditCard}>Edit</button>
          <h4>Children:</h4>
          <CardList cards={viewingCard.children} />
        </div>
      )}
    </div>
  );
}
