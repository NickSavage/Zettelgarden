import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag } from "../../models/Tags";
import { deleteTag } from "../../api/tags";

import { useTagContext } from "../../contexts/TagContext";

interface TagListItemInterface {
  tag: Tag;
}

export function TagListItem({ tag }: TagListItemInterface) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const { setRefreshTags } = useTagContext();

  const navigate = useNavigate();

  function toggleMenu() {
    setShowMenu(!showMenu);
  }
  function handleViewCards() {
    let searchTerm = "#" + tag.name
    navigate(`/app/search?term=${encodeURIComponent(searchTerm)}`)
  }
  function handleViewTasks() {}
  async function handleDelete() {
    let _ = await deleteTag(tag.id)
      .then((data) => {
        setRefreshTags(true);
      })
      .catch((error) =>
        alert(
          "Unable to delete tag, make sure no cards or tasks are using it first.",
        ),
      );
    setShowMenu(false);
  }

  return (
    <li>
      <div className="w-full px-4 flex">
        <div className="flex-grow">{tag.name}</div>

        <div className="dropdown">
          <button onClick={toggleMenu} className="menu-button">
            ⋮
          </button>
          {showMenu && (
            <div className="popup-menu">
              <button onClick={() => handleViewCards()}>View Cards</button>
              <button onClick={() => handleViewTasks()}>View Tasks</button>
              <button onClick={() => handleDelete()}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
