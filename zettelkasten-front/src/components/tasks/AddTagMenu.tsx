import React, { useState, ChangeEvent } from "react";
import { Task } from "../../models/Task";
import { useTaskContext } from "../../contexts/TaskContext";

interface AddTagMenuProps {
  task: Task;
  setRefresh: (refresh: boolean) => void;
  setShowTagMenu: (showMenu: boolean) => void;
  handleAddTag: (tag: string) => void;
}

export function AddTagMenu({
  task,
  setRefresh,
  setShowTagMenu,
  handleAddTag,
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
            <div key={tag}></div>
          ) : (
            <button key={tag} onClick={() => handleExistingTagClick(tag)}>{tag}</button>
          ),
        )}
    </div>
  );
}
