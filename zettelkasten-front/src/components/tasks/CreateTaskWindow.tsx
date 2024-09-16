import React, { useState, useEffect } from "react";
import { saveNewTask } from "../..//api/tasks";

import { Task, emptyTask } from "../../models/Task";
import { Card, PartialCard } from "../..//models/Card";
import { BacklinkInput } from "../cards/BacklinkInput";
import { TaskDateDisplay } from "./TaskDateDisplay";
import { Button } from "../Button";
import { AddTagMenu } from "../../components/tags/AddTagMenu";

interface CreateTaskWindowProps {
  currentCard: Card | PartialCard | null;
  setRefresh: (refresh: boolean) => void;
  setShowTaskWindow: (showTaskWindow: boolean) => void;
}

export function CreateTaskWindow({
  currentCard,
  setRefresh,
  setShowTaskWindow,
}: CreateTaskWindowProps) {
  const [newTask, setNewTask] = useState<Task>(emptyTask);
  const [selectedCard, setSelectedCard] = useState<PartialCard | null>(null);

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  async function handleSaveTask() {
    let response;

    console.log("create card", currentCard);

    let task = newTask;
    if (currentCard) {
      task = { ...task, card_pk: currentCard.id };
    }
    response = await saveNewTask(task);
    if (!("error" in response)) {
      setRefresh(true);
      setShowTaskWindow(false);
      setSelectedCard(null);
      let date = newTask.scheduled_date;
      setNewTask({ ...emptyTask, scheduled_date: date });
      if (currentCard) {
        setNewTask({ ...emptyTask, card_pk: currentCard.id });
      }
    }
  }
  function handleBacklink(card: PartialCard) {
    setSelectedCard(card);
    setNewTask({ ...newTask, card_pk: card.id });
  }

  function toggleMenu() {
    if (showTagMenu) {
      setShowTagMenu(false);
    }
    setShowMenu(!showMenu);
  }

  async function handleAddTagClick() {
    setShowMenu(false);
    setShowTagMenu(true);
  }
  async function handleAddTag(tag: string) {
    let editedTask = { ...newTask, title: newTask.title + " " + tag };
    setNewTask(editedTask);
    setShowTagMenu(false)
  }
  const handleKeyPress = (event: KeyboardEvent) => {
    // if this is true, the user is using a system shortcut, don't do anything with it
    if (event.metaKey) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      return;
    }
  };

  useEffect(() => {
  const keyDownListener = (event: KeyboardEvent) => handleKeyPress(event);
  document.addEventListener("keydown", keyDownListener);
  return () => {
    document.removeEventListener("keydown", keyDownListener);
  };
  }, []);

  return (
    <div
      className="create-task-popup-overlay"
      onClick={() => setShowTaskWindow(false)}
    >
      <div
        className="create-task-popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-task-window">
          <div className="create-task-window-top">
            <span className="block mb-2 font-bold text-gray-700">
              {"New Task"}
            </span>
            <div className="flex mb-2">
              <input
                className="
w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 focus:border-blue-500
"
                placeholder="Enter new task"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    handleSaveTask();
                  }
                }}
                autoFocus
              />
              <div className="dropdown">
                <button onClick={toggleMenu} className="menu-button">
                  ⋮
                </button>
                {showMenu && (
                  <div className="popup-menu">
                    <button onClick={() => handleAddTagClick()}>Add Tag</button>
                  </div>
                )}
                {showTagMenu && (
                  <div className="popup-menu">
                    <AddTagMenu
                      task={newTask}
                      setRefresh={setRefresh}
                      setShowTagMenu={setShowTagMenu}
                      handleAddTag={handleAddTag}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="create-task-window-bottom">
            <div className="create-task-window-bottom-left">
              {!currentCard && <BacklinkInput addBacklink={handleBacklink} />}
            </div>
            <div className="create-task-window-bottom-middle">
              {selectedCard && (
                <span style={{ fontWeight: "bold", color: "blue" }}>
                  [{selectedCard?.card_id}]
                </span>
              )}
              <TaskDateDisplay
                task={newTask}
                setTask={setNewTask}
                setRefresh={setRefresh}
                saveOnChange={false}
              />
            </div>
            <div className="create-task-window-bottom-right">
            <Button onClick={handleSaveTask} children="Save" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
