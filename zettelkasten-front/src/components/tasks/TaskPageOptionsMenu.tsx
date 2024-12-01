import React, { useState } from "react";
import { useTaskContext } from "../../contexts/TaskContext";
import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";
import { Tag } from "../../models/Tags";

interface TaskPageOptionsMenu {
  tags: Tag[];
  handleTagClick: (tag: string) => void;
}

export function TaskPageOptionsMenu({
  tags,
  handleTagClick,
}: TaskPageOptionsMenu) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const { setRefreshTasks, showCompleted, setShowCompleted } = useTaskContext();
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  function toggleMenu() {
    setShowMenu(!showMenu);
    setShowTagMenu(false);
  }

  function toggleTagMenu() {
    setShowMenu(false);
    setShowTagMenu(true);
  }

  function toggleViewCompleted() {
    setShowCompleted(!showCompleted);
    setRefreshTasks(true);
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <div className="dropdown">
        <button
          onClick={toggleMenu}
          className="font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 bg-palette-dark text-white hover:bg-palette-darkest focus:ring-blue-500 px-4 py-2"
        >
          Actions
        </button>
        {showMenu && (
          <div className="popup-menu w-64 absolute left-0">
            {showCompleted ? (
              <button onClick={toggleViewCompleted}>Hide Completed</button>
            ) : (
              <button onClick={toggleViewCompleted}>View Completed</button>
            )}

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
    </div>
  );
}
