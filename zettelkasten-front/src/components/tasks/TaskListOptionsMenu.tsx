import React, { useState } from "react";
import { Task } from "../../models/Task";

import { deleteTask, saveExistingTask } from "../../api/tasks";

import { AddTagMenu } from "../../components/tasks/AddTagMenu";

interface TaskListOptionsMenuProps {
  task: Task;
  setRefresh: (refresh: boolean) => void;
  showCardLink: boolean;
  setShowCardLink: (show: boolean) => void;
}

export function TaskListOptionsMenu({
  task,
  setRefresh,
  showCardLink,
  setShowCardLink,
}: TaskListOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

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
  async function handleDelete() {
    let _ = await deleteTask(task.id);
    setRefresh(true);
    setShowMenu(false);
  }

  async function handleAddTag(tag: string) {
    let editedTask = { ...task, title: task.title + " " + tag };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
      setShowTagMenu(false);
    }
  }
  function toggleCardLink() {
    setShowCardLink(!showCardLink);
    setShowMenu(false);
  }
  async function handleCardUnlink() {
    let editedTask = { ...task, card_pk: 0 };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
    }
    setShowMenu(false);
  }

  return (
    <div>
      <div className="dropdown">
        <button onClick={toggleMenu} className="menu-button">
          ⋮
        </button>
        {showMenu && (
          <div className="popup-menu">
            {task.card_pk === 0 ? (
              <button onClick={() => toggleCardLink()}>Link Card</button>
            ) : (
              <button onClick={() => handleCardUnlink()}>Unlink Card</button>
            )}
            <button onClick={() => handleAddTagClick()}>Add Tag</button>
            <button onClick={() => handleDelete()}>Delete</button>
          </div>
        )}
        {showTagMenu && (
          <div className="popup-menu">
            <AddTagMenu
              task={task}
              setRefresh={setRefresh}
              setShowTagMenu={setShowTagMenu}
              handleAddTag={handleAddTag}
            />
          </div>
        )}
      </div>
    </div>
  );
}
