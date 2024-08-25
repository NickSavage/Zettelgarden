import React, { useState, useEffect } from "react";
import { CardBody } from "../../components/cards/CardBody";
import { CardItem } from "../../components/cards/CardItem";
import { CardList } from "../../components/cards/CardList";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { getCard, saveExistingCard } from "../../api/cards";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Card, PartialCard } from "../../models/Card";
import { File } from "../../models/File";
import { isErrorResponse } from "../../models/common";
import { TaskListItem } from "../../components/tasks/TaskListItem";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTaskContext } from "../../contexts/TaskContext";
import { HeaderSection, HeaderSubSection } from "../../components/Header";
import { Button } from "../../components/Button";
import { linkifyWithDefaultOptions } from "../../utils/strings";
import { NonNullChain } from "typescript";

interface ViewPageProps {
  setLastCard: (card: Card | null) => void;
}

export function ViewPage({ setLastCard }: ViewPageProps) {
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
        setLastCard(refreshed);

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
            <HeaderSection text=": " />
            <HeaderSection text={viewingCard.title} />
          </h3>
          <hr />
          <div>
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
          <div className="flex align-center">
            <BacklinkInput addBacklink={handleAddBacklink} />
            <Button onClick={handleEditCard} children="Edit" />
          </div>
          <div>
            <span className="text-xs">
              Created At: {viewingCard.created_at}
            </span>
            <br />
            <span className="text-xs">
              Updated At: {viewingCard.updated_at}
            </span>
          </div>
          <hr />
          {parentCard && (
            <div>
              <HeaderSubSection text="Parent" />
              <ul>
                <CardItem card={parentCard} />
              </ul>
            </div>
          )}
          {viewingCard.files.length > 0 && (
            <div>
              <HeaderSubSection text="Files" />
              <ul>
                {viewingCard.files.map((file, index) => (
                  <FileListItem
                    file={file}
                    onDelete={onFileDelete}
                    setRefreshFiles={(refresh: boolean) => {}}
                  />
                ))}
              </ul>
            </div>
          )}
          <HeaderSubSection text="Tasks" />
          <Button onClick={toggleCreateTaskWindow} children={"Add Task"} />
          {showCreateTaskWindow && (
            <CreateTaskWindow
              currentCard={viewingCard}
              setRefresh={setRefreshTasks}
              setShowTaskWindow={setShowCreateTaskWindow}
            />
          )}
          {cardTasks.map((task, index) => (
            <TaskListItem task={task} setRefresh={setRefreshTasks} onTagClick={(tag: string) => {}} />
          ))}

          <HeaderSubSection text="References" />
          <CardList cards={viewingCard.references} />
          <div></div>
          {viewingCard.children.length > 0 && (
            <div>
              <HeaderSubSection text="Children" />
              <CardList cards={viewingCard.children} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
