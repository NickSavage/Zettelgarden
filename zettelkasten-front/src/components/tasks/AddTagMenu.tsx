import React, { useState, ChangeEvent } from "react";
import { Task } from "../../models/Task";
import { saveExistingTask } from "../../api/tasks";
import { useTaskContext } from "../../contexts/TaskContext";

interface AddTagMenuProps {
  task: Task;
  setRefresh: (refresh: boolean) => void;
  setShowTagMenu: (showMenu: boolean) => void;
}

export function AddTagMenu({
  task,
  setRefresh,
  setShowTagMenu,
}: AddTagMenuProps) {
  const [textInput, setTextInput] = useState<string>("");
  const { existingTags } = useTaskContext();

  function handleExistingTagClick(tag: string) {
    handleAddTag(tag);
  }

  function handleInput(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setTextInput(e.target.value);
  }

  async function handleEnter() {
    handleAddTag("#" + textInput);
  }

  async function handleAddTag(tag: string) {
    let editedTask = { ...task, title: task.title + " " + tag };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
      setShowTagMenu(false);
    }
  }

  return (
    <div className="w-24">
      <input
        type="text"
        value={textInput}
        placeholder="Tag"
        onChange={handleInput}
        onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter") {
            handleEnter();
          }
        }}
      />
      {existingTags &&
        existingTags.map((tag) =>
          task.title.includes(tag) ? (
            <div></div>
          ) : (
            <button onClick={() => handleExistingTagClick(tag)}>{tag}</button>
          ),
        )}
    </div>
  );
}
