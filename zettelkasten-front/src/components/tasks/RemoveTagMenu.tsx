import React, { useState, useEffect, ChangeEvent } from "react";
import { Task } from "../../models/Task";
import { saveExistingTask } from "../../api/tasks";
import { useTaskContext } from "../../contexts/TaskContext";

interface RemoveTagMenuProps {
  task: Task;
  tags: string[];
  setShowRemoveMenu: (showMenu: boolean) => void;
  handleRemoveTag: (tag: string) => void;
}

export function RemoveTagMenu({
  task,
  tags,
  setShowRemoveMenu,
  handleRemoveTag,
}: RemoveTagMenuProps) {
  function handleExistingTagClick(tag: string) {
    handleRemoveTag(tag);
  }

  useEffect(() => {
    console.log("remove", tags);
  }, []);

  return (
    <div className="w-24">
      {tags &&
        tags.map((tag) => (
          <button onClick={() => handleExistingTagClick(tag)}>{tag}</button>
        ))}
    </div>
  );
}
