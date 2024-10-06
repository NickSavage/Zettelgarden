import React, { useEffect, useState } from "react";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTagContext } from "../../contexts/TagContext";
import { useTaskContext } from "../../contexts/TaskContext";
import { saveExistingCard } from "../../api/cards";
import { Button } from "../../components/Button";
import { FileUpload } from "../../components/files/FileUpload";
import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";

interface ViewCardOptionsMenu {
  viewingCard: Card;
  setViewCard: (card: Card) => void;
  setMessage: (message: string) => void;
}

export function ViewCardOptionsMenu({
  viewingCard,
  setViewCard,
  setMessage,
}: ViewCardOptionsMenu) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [showCreateTaskWindow, setShowCreateTaskWindow] =
    useState<boolean>(false);
  const { setRefreshTasks } = useTaskContext();
  const { tags } = useTagContext();

  function toggleCreateTaskWindow() {
    setShowCreateTaskWindow(!showCreateTaskWindow);
    setShowMenu(!showMenu);
  }

  function toggleMenu() {
    //setShowTagMenu(false);
    //    setShowRemoveMenu(false);
    setShowMenu(!showMenu);
    setShowTagMenu(false);
  }

  function toggleTagMenu() {
    setShowMenu(false);
    setShowTagMenu(true);
  }

  async function handleTagClick(tagName: string) {
    setShowMenu(false);
    setShowTagMenu(false);
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

  return (
    <div>
      <div className="dropdown">
        <button
          onClick={toggleMenu}
          className="font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 bg-palette-dark text-white hover:bg-palette-darkest focus:ring-blue-500"
        >
          Actions
        </button>
        {showMenu && (
          <div className="popup-menu w-64">
            <button onClick={toggleCreateTaskWindow}>Add Task</button>
            <FileUpload
              setRefresh={(refresh: boolean) => {}}
              setMessage={setMessage}
              card={viewingCard}
            />
            <button onClick={toggleTagMenu}>Add Tags</button>
          </div>
        )}
      </div>
      {showTagMenu && (
        <SearchTagDropdown
          tags={tags}
          handleTagClick={handleTagClick}
          setShowTagMenu={setShowTagMenu}
        />
      )}
      {showCreateTaskWindow && (
        <CreateTaskWindow
          currentCard={viewingCard}
          setRefresh={setRefreshTasks}
          setShowTaskWindow={setShowCreateTaskWindow}
        />
      )}
    </div>
  );
}
