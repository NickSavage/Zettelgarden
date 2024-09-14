import React, { useState } from "react";
import { Task } from "../../models/Task";
import { Tag } from "../../models/Tags";

import { deleteTask, saveExistingTask } from "../../api/tasks";

import { AddTagMenu } from "../../components/tasks/AddTagMenu";
import { RemoveTagMenu } from "../../components/tasks/RemoveTagMenu";

interface TaskListOptionsMenuProps {
  task: Task;
  tags: Tag[];
  setRefresh: (refresh: boolean) => void;
  showCardLink: boolean;
  setShowCardLink: (show: boolean) => void;
}

export function TaskListOptionsMenu({
  task,
  tags,
  setRefresh,
  showCardLink,
  setShowCardLink,
}: TaskListOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [showRemoveMenu, setShowRemoveMenu] = useState<boolean>(false);

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
  async function handleDelete() {
    let _ = await deleteTask(task.id);
    setRefresh(true);
    setShowMenu(false);
  }

  async function handleAddTag(tagName: string) {
    let editedTask = { ...task, title: task.title + " " + tagName };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
      setShowTagMenu(false);
    }
  }

  async function handleRemoveTag(tag: Tag) {
    const tagRegex = new RegExp(`(?:^|\\s)${tag.name}(?=\\s|$)`, "g");
    let editedTitle = task.title.replace(tagRegex, "").trim();
    editedTitle = editedTitle.replace(/\s+/g, " ");
    let editedTask = { ...task, title: editedTitle };

    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
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
            {tags.length > 0 && (
              <button onClick={() => handleRemoveTagClick()}>Remove Tag</button>
            )}
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
