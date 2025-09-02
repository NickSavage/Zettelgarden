import React, { useState } from "react";
import { useTaskContext } from "../../contexts/TaskContext";
import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";
import { Tag } from "../../models/Tags";
import { BulkTaskDateDisplay } from "./BulkTaskDateDisplay";
import { Task } from "../../models/Task";

interface TaskPageOptionsMenu {
  tags: Tag[];
  handleTagClick: (tag: string) => void;
  tasks: Task[];
}

export function TaskPageOptionsMenu({
  tags,
  handleTagClick,
  tasks,
}: TaskPageOptionsMenu) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const { setRefreshTasks } = useTaskContext();
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [showBulkEdit, setShowBulkEdit] = useState<boolean>(false);

  function toggleMenu() {
    setShowMenu(!showMenu);
    setShowTagMenu(false);
    setShowBulkEdit(false);
  }

  function toggleTagMenu() {
    setShowMenu(false);
    setShowTagMenu(true);
  }

  function toggleBulkEdit() {
    setShowMenu(false);
    setShowBulkEdit(true);
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
          <div className="popup-menu w-64 absolute right-0">
            <button onClick={toggleTagMenu}>Add Tags</button>
            <button onClick={toggleBulkEdit}>Bulk Edit Date</button>
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
      {showBulkEdit && (
        <BulkTaskDateDisplay tasks={tasks} setShowBulkEdit={setShowBulkEdit} />
      )}
    </div>
  );
}
