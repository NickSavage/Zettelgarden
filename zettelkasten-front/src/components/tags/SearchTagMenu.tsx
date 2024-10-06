import React, { useState, ChangeEvent } from "react";

import { Tag } from "../../models/Tags";
import { SearchTagDropdown } from "./SearchTagDropdown";

interface SearchTagMenuProps {
  tags: Tag[];
  handleTagClick: (tag: string) => void;
}
export function SearchTagMenu({ tags, handleTagClick }: SearchTagMenuProps) {
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);

  function toggleTagMenu() {
    setShowTagMenu(!showTagMenu);
  }

  return (
    <div>
      <button onClick={toggleTagMenu}>Tags</button>
      {showTagMenu && (
        <SearchTagDropdown
          tags={tags}
          handleTagClick={handleTagClick}
          setShowTagMenu={setShowTagMenu}
        />
      )}
    </div>
  );
}
