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
  currentFilter?: string;
}

export function CreateTaskWindow({
  currentCard,
  setRefresh,
  setShowTaskWindow,
  currentFilter,
}: CreateTaskWindowProps) {
  const [newTask, setNewTask] = useState<Task>({
    ...emptyTask,
    scheduled_date: new Date(),
  });
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
      setNewTask({ ...emptyTask, scheduled_date: new Date() });
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
  async function handleAddRecurring(tag: string) {
    let editedTask = { ...newTask, title: newTask.title + " " + tag };
    setNewTask(editedTask);
    setShowTagMenu(false);
    setShowMenu(false);
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

  useEffect(() => {
    if (currentFilter === undefined) {
      setNewTask({ ...newTask, title: "" });
    } else {
      setNewTask({ ...newTask, title: currentFilter + " " });
    }
  }, [currentFilter]);

  // console.log("create task", currentFilter);

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
                  <div className="absolute right-0 top-full bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
                    <button 
                      onClick={() => handleAddTagClick()} 
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    >
                      Add Tag
                    </button>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div className="py-1">
                      <div className="px-4 py-1 text-sm font-medium text-gray-600">
                        Recurring Task
                      </div>
                      <button 
                        onClick={() => handleAddRecurring("every day")} 
                        className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        Daily
                      </button>
                      <button 
                        onClick={() => handleAddRecurring("every week")} 
                        className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        Weekly
                      </button>
                      <button 
                        onClick={() => handleAddRecurring("every month")} 
                        className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        Monthly
                      </button>
                      <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-100 bg-gray-50">
                        Tip: You can type "every X days/weeks/months" for custom intervals
                      </div>
                    </div>
                  </div>
                )}
                {showTagMenu && (
                  <div className="popup-menu">
                    <AddTagMenu task={newTask} handleAddTag={handleAddRecurring} />
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
