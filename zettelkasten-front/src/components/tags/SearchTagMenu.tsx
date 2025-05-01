import React, { useState, ChangeEvent } from "react";

import { Tag } from "../../models/Tags";
import { SearchTagDropdown } from "./SearchTagDropdown";
import { Button } from "../../components/Button";

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
      <Button onClick={toggleTagMenu} children={"Tags"} />
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
