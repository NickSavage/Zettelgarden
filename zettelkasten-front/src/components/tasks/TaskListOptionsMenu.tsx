import React, { useState } from "react";
import { Task } from "../../models/Task";
import { Tag } from "../../models/Tags";

import { saveExistingTask } from "../../api/tasks";

import { AddTagMenu } from "../../components/tags/AddTagMenu";
import { RemoveTagMenu } from "../../components/tasks/RemoveTagMenu";
import { useTaskContext } from "../../contexts/TaskContext";

interface TaskListOptionsMenuProps {
  task: Task;
  tags: Tag[];
  showCardLink: boolean;
  setShowCardLink: (show: boolean) => void;
}

export function TaskListOptionsMenu({
  task,
  tags,
  showCardLink,
  setShowCardLink,
}: TaskListOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [showRemoveMenu, setShowRemoveMenu] = useState<boolean>(false);
  const { setRefreshTasks } = useTaskContext();

  function toggleMenu() {
    setShowTagMenu(false);
    setShowRemoveMenu(false);
    setShowMenu(!showMenu);
  }

  async function handleAddTagClick() {
    setShowMenu(false);
    setShowTagMenu(true);
    setShowRemoveMenu(false);
  }

  async function handleRemoveTagClick() {
    setShowMenu(false);
    setShowTagMenu(false);
    setShowRemoveMenu(true);
  }

  async function handleAddTag(tagName: string) {
    let editedTask = { ...task, title: task.title + " " + tagName };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefreshTasks(true);
      setShowTagMenu(false);
    }
  }

  async function handleRemoveTag(tag: string) {
    const tagRegex = new RegExp(`(?:^|\\s)${tag}(?=\\s|$)`, "g");
    let editedTitle = task.title.replace(tagRegex, "").trim();
    editedTitle = editedTitle.replace(/\s+/g, " ");
    let editedTask = { ...task, title: editedTitle };

    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefreshTasks(true);
      setShowRemoveMenu(false);
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
      setRefreshTasks(true);
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
            {tags.length > 0 && (
              <button onClick={() => handleRemoveTagClick()}>Remove Tag</button>
            )}
          </div>
        )}
        {showTagMenu && (
          <div className="popup-menu">
            <AddTagMenu
              task={task}
              handleAddTag={handleAddTag}
            />
          </div>
        )}
        {showRemoveMenu && (
          <div className="popup-menu">
            <RemoveTagMenu
              task={task}
              tags={tags}
              setShowRemoveMenu={setShowRemoveMenu}
              handleRemoveTag={handleRemoveTag}
            />
          </div>
        )}
      </div>
    </div>
  );
}
