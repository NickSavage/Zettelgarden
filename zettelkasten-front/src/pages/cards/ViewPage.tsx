import React, { useState, useEffect } from "react";
import { CardBody } from "../../components/cards/CardBody";
import { CardItem } from "../../components/cards/CardItem";
import { CardList } from "../../components/cards/CardList";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { getCard, saveExistingCard } from "../../api/cards";
import { compareCardIds } from "../../utils/cards";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Card, PartialCard } from "../../models/Card";
import { File } from "../../models/File";
import { isErrorResponse } from "../../models/common";
import { TaskListItem } from "../../components/tasks/TaskListItem";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTaskContext } from "../../contexts/TaskContext";
import {
  HeaderTop,
  HeaderSection,
  HeaderSubSection,
} from "../../components/Header";
import { Button } from "../../components/Button";
import { linkifyWithDefaultOptions } from "../../utils/strings";
import { convertCardToPartialCard } from "../../utils/cards";
import { ChildrenCards } from "../../components/cards/ChildrenCards";
import { FileUpload } from "../../components/files/FileUpload";

import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { useTagContext } from "../../contexts/TagContext";
import { usePartialCardContext } from "../../contexts/CardContext";

interface ViewPageProps {}

export function ViewPage({}: ViewPageProps) {
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

  const { setLastCard } = usePartialCardContext();
  const { tags } = useTagContext();

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

  async function handleTagClick(tagName: string) {
    if (viewingCard === null) {
      return;
    }

    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + "\n\n#" + tagName,
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
    <div className="px-20 py-4">
      {error && (
        <div>
          // <h3>Unauthorized</h3>
          <div>{error}</div>
        </div>
      )}
      {viewingCard && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <h1 className="">
                <span style={{ fontWeight: "bold", color: "blue" }}>
                  {viewingCard.card_id}
                </span>
                <HeaderTop text=": " />
                <HeaderTop text={viewingCard.title} />
                {viewingCard.is_literature_card && (
                  <span className="pl-2 text-purple-500 text-sm">
                    {"Literature Card"}
                  </span>
                )}
                {viewingCard.tags.length > 0 &&
                  viewingCard.tags.map((tag) => (
                    <span className="pl-2 text-purple-500 text-sm">
                      #{tag.name}
                    </span>
                  ))}
              </h1>
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
              <SearchTagMenu tags={tags} handleTagClick={handleTagClick} />
            </div>
            <div className="text-xs">
              <span className="font-bold">Created At:</span>
              <span> {viewingCard.created_at}</span>
              <br />
              <span className="font-bold">Updated At:</span>
              <span> {viewingCard.updated_at}</span>
              {viewingCard.keywords && (
                <div>
                  <span className="font-bold">{"Keywords: "} </span>
                  {viewingCard.keywords.map((keyword, index) => (
                    <span>{keyword.keyword} </span>
                  ))}
                </div>
              )}
            </div>
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
          <HeaderSubSection text="Files" />
          <FileUpload
            setRefresh={(refresh: boolean) => {}}
            setMessage={setError}
            card={viewingCard}
          />
          {viewingCard.files.length > 0 && (
            <div>
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
            <TaskListItem
              task={task}
              setRefresh={setRefreshTasks}
              onTagClick={(tag: string) => {}}
            />
          ))}

          <HeaderSubSection text="References" />
          <CardList cards={viewingCard.references} />
          {viewingCard.children.length > 0 && (
            <div>
              <HeaderSubSection text="Children" />
              <ChildrenCards
                allChildren={viewingCard.children.sort((a, b) => compareCardIds(a.card_id, b.card_id))}
                card={viewingCard}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
