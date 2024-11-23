import React, { useState } from "react";
import { useTaskContext } from "../../contexts/TaskContext";

interface TaskPageOptionsMenu {}

export function TaskPageOptionsMenu({}: TaskPageOptionsMenu) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const { setRefreshTasks, showCompleted, setShowCompleted } = useTaskContext();

  function toggleMenu() {
    setShowMenu(!showMenu);
  }

  function toggleViewCompleted() {
    setShowCompleted(!showCompleted);
    setRefreshTasks(true);
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
            {showCompleted ? (
              <button onClick={toggleViewCompleted}>Hide Completed</button>
            ) : (
              <button onClick={toggleViewCompleted}>View Completed</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
