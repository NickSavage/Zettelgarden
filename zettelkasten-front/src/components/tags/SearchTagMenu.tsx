import React, { useState, ChangeEvent } from "react";

import { Tag } from "../../models/Tags";

interface SearchTagMenuProps {
  tags: Tag[];
  handleTagClick: (tag: string) => void;
}
export function SearchTagMenu({ tags, handleTagClick }: SearchTagMenuProps) {
  const [textInput, setTextInput] = useState<string>("");
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  function toggleTagMenu() {
    setShowTagMenu(!showTagMenu);
  }

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
    <div>
      <button onClick={toggleTagMenu}>Tags</button>
      {showTagMenu && (
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
                    <button
                      key={tag.id}
                      onClick={() => handleTagClickHook(tag)}
                    >
                      #{tag.name}
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
