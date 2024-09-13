import React, { useState, ChangeEvent } from "react";

import { Tag } from "../../models/Tags";
import { Button } from "../../components/Button";

interface SearchTagMenuProps {
  tags: Tag[];
  handleTagClick: (tag: Tag) => void;
}
export function SearchTagMenu({ tags, handleTagClick }: SearchTagMenuProps) {
  const [textTagInput, setTextTagInput] = useState<string>("");
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  function toggleTagMenu() {
    setShowTagMenu(!showTagMenu);
  }

  function handleTagClickHook(tag: Tag) {
    setShowTagMenu(false);
    handleTagClick(tag);
  }

  return (
    <div>
      <button onClick={toggleTagMenu}>Tags</button>
      {showTagMenu && (
        <div className="dropdown">
          <div className="popup-menu">
            <div className="w-32">
              {tags &&
                tags.map((tag) => (
                  <button key={tag.id} onClick={() => handleTagClickHook(tag)}>
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
