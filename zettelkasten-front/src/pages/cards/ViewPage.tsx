import React, { useState, useEffect } from "react";
import { CardBody } from "../../components/cards/CardBody";
import { CardItem } from "../../components/cards/CardItem";
import { CardList } from "../../components/cards/CardList";
import { FileListItem } from "../../components/files/FileListItem";
import { BacklinkInput } from "../../components/cards/BacklinkInput";
import { getCard, saveExistingCard, fetchRelatedCards } from "../../api/cards";
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
  const [relatedCards, setRelatedCards] = useState<PartialCard[]>([]);
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

  const [activeTab, setActiveTab] = useState<string>("Children");

  const tabs = [
    { label: "Children" },
    { label: "References" },
    { label: "Related" },
    { label: "Files" },
  ];

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

  async function handleDisplayFileOnCardClick(file: File) {
    if (viewingCard === null) {
      return;
    }

    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + "\n\n![](" + file.id + ")",
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

  async function handleFetchRelatedCards(id: string) {
    let response = await fetchRelatedCards(id);

    if (isErrorResponse(response)) {
      setError(response["error"]);
    } else {
      setRelatedCards(response);
    }
  }

  function handleTabClick(label: string) {
    setActiveTab(label);
  }

  // For initial fetch and when id changes
  useEffect(() => {
    setError("");
    fetchCard(id!);
    setRefreshTasks(true);
    handleFetchRelatedCards(id!);
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
                <HeaderTop className="pr-2" text={viewingCard.title} />
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
              <span> {viewingCard.created_at.toISOString()}</span>
              <br />
              <span className="font-bold">Updated At:</span>
              <span> {viewingCard.updated_at.toISOString()}</span>
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

          <div>
            <div className="flex">
              {tabs.map((tab) => (
                <span
                  key={tab.label}
                  onClick={() => handleTabClick(tab.label)}
                  className={`
            cursor-pointer font-medium py-1.5 px-3 rounded-md flex items-center
            ${
              activeTab === tab.label
                ? "text-blue-600 border-b-4 border-blue-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }
          `}
                >
                  {tab.label}
                  <span className="ml-1 text-xs font-semibold bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
                    {tab.label === "Children" && viewingCard.children.length}
                    {tab.label === "References" &&
                      viewingCard.references.length}
                    {tab.label === "Related" && relatedCards.length}
                    {tab.label === "Files" && viewingCard.files.length}
                  </span>
                </span>
              ))}
            </div>
            {activeTab === "References" && (
              <div>
                <HeaderSubSection text="References" />
                <CardList
                  cards={viewingCard.references.sort((a, b) =>
                    compareCardIds(a.card_id, b.card_id),
                  )}
                />
              </div>
            )}
            {activeTab === "Children" && (
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
                  </div>
                )}
              </div>
            )}
            {activeTab === "Related" && (
              <div>
                <HeaderSubSection text="Related Cards" />
                <CardList cards={relatedCards} />
              </div>
            )}
            {activeTab === "Files" && (
              <div>
                {viewingCard.files.length > 0 && (
                  <div>
                    <ul>
                      {viewingCard.files.map((file, index) => (
                        <FileListItem
                          file={file}
                          onDelete={onFileDelete}
                          setRefreshFiles={(refresh: boolean) => {}}
                          displayFileOnCard={(file: File) => {
                            handleDisplayFileOnCardClick(file);
                          }}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
