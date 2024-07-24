import React, { useState } from "react";
import { SettingsIcon } from "../../assets/icons/SettingsIcon";
import { ToggleSlider } from "../../components/ToggleSlider";

interface TaskViewOptionsMenuProps {
  showCompleted: boolean;
  setShowCompleted: (showCompleted: boolean) => void;
}

export function TaskViewOptionsMenu({
  showCompleted,
  setShowCompleted,
}: TaskViewOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  function handleToggleMenu() {
    console.log("asdfad");
    setShowMenu(!showMenu);
  }

  return (
    <div className="task-options-view-menu">
      <div onClick={handleToggleMenu}>
        <SettingsIcon />
      </div>
      {showMenu && (
        <div className="task-options-view-menu-content">
          <ToggleSlider
            label={"Show Completed"}
            initialState={showCompleted}
            onToggle={setShowCompleted}
          />
        </div>
      )}
    </div>
  );
}
