import React, { useState, ChangeEvent } from "react";

interface SearchTagDropdownProps {
  tags: Tag[];
  handleTagClick: (tag: string) => void;
  setShowTagMenu: (show: boolean) => void;
}

export function SearchTagDropdown({
  tags,
  handleTagClick,
  setShowTagMenu,
}: SearchTagDropdownProps) {
  const [textInput, setTextInput] = useState<string>("");
  function handleTagClickHook(tag: Tag) {
    setShowTagMenu(false);
    handleTagClick(tag.name);
  }

  function handleInput(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setTextInput(e.target.value);
  }
  return (
    <div className="dropdown">
      <div className="popup-menu">
        <div className="w-32 overflow-y-auto max-h-64">
          <input
            type="text"
            value={textInput}
            placeholder="Tag"
            onChange={handleInput}
          />
          {tags &&
            tags
              .filter((tag) =>
                tag.name.toLowerCase().includes(textInput.toLowerCase()),
              )
              .map((tag) => (
                <button key={tag.id} onClick={() => handleTagClickHook(tag)}>
                  #{tag.name}
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
