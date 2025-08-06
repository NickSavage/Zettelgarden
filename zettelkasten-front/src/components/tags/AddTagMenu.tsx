import React, { useState, ChangeEvent } from "react";
import { Task } from "../../models/Task";
import { Tag } from "../../models/Tags";
import { useTagContext } from "../../contexts/TagContext";

interface AddTagMenuProps {
  task: Task;
  handleAddTag: (tagName: string) => void;
}

export function AddTagMenu({ task, handleAddTag }: AddTagMenuProps) {
  const [textInput, setTextInput] = useState<string>("");
  const { tags, setRefreshTags } = useTagContext();

  function handleExistingTagClick(tag: Tag) {
    handleAddTag("#" + tag.name);
    setRefreshTags(true);
  }

  function handleInput(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setTextInput(e.target.value);
  }

  async function handleEnter() {
    handleAddTag("#" + textInput);
    setRefreshTags(true);
  }

  console.log("tags", tags)

  return (
    <div className="w-32 overflow-y-auto max-h-64">
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
      {tags &&
        tags
          .filter((tag) =>
            tag.name.toLowerCase().includes(textInput.toLowerCase()),
          )
          .map((tag) =>
            task.title.includes("#" + tag.name) ? (
              <div key={tag.id}></div>
            ) : (
              <button key={tag.id} onClick={() => handleExistingTagClick(tag)}>
                {"#" + tag.name}
              </button>
            ),
          )}
    </div>
  );
}
