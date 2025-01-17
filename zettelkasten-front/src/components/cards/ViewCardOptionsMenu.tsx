import React, { useEffect, useState } from "react";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTagContext } from "../../contexts/TagContext";
import { saveExistingCard } from "../../api/cards";
import { FileUpload } from "../../components/files/FileUpload";
import { SearchTagDropdown } from "../../components/tags/SearchTagDropdown";
import { Card } from "../../models/Card";
import { PopupMenu } from "../common/PopupMenu";
import { Button } from "../Button";

interface ViewCardOptionsMenu {
  viewingCard: Card;
  setViewCard: (card: Card) => void;
  setMessage: (message: string) => void;
  onEdit: () => void;
}

export function ViewCardOptionsMenu({
  viewingCard,
  setViewCard,
  setMessage,
  onEdit,
}: ViewCardOptionsMenu) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [showCreateTaskWindow, setShowCreateTaskWindow] =
    useState<boolean>(false);
  const { tags } = useTagContext();

  // Create a ref for the file upload component
  const fileUploadRef = React.useRef<HTMLInputElement>(null);

  function toggleCreateTaskWindow() {
    setShowCreateTaskWindow(!showCreateTaskWindow);
    setShowMenu(!showMenu);
  }

  function toggleMenu() {
    //setShowTagMenu(false);
    //    setShowRemoveMenu(false);
    setShowMenu(!showMenu);
    setShowTagMenu(false);
  }

  function toggleTagMenu() {
    setShowMenu(false);
    setShowTagMenu(true);
  }

  async function handleTagClick(tagName: string) {
    setShowMenu(false);
    setShowTagMenu(false);
    if (viewingCard === null) {
      return;
    }

    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + "\n\n#" + tagName,
    };
    let response = await saveExistingCard(editedCard);
    setViewCard(editedCard);
  }

  const menuOptions = [
    { label: "Edit Card", onClick: onEdit },
    { label: "Add Task", onClick: toggleCreateTaskWindow },
    {
      label: "Select File To Upload",
      onClick: () => {
        setShowMenu(false);
        // Trigger the file upload input
        if (fileUploadRef.current) {
          fileUploadRef.current.click();
        }
      }
    },
    { label: "Add Tags", onClick: toggleTagMenu }
  ];

  return (
    <div className="relative">
      <div className="mt-2 md:mt-0 md:ml-4">
        <Button onClick={toggleMenu} >Actions</Button>
      </div>
      <PopupMenu options={menuOptions} isOpen={showMenu} />
      <FileUpload
        ref={fileUploadRef}
        setMessage={setMessage}
        card={viewingCard}
      />
      {showTagMenu && (
        <SearchTagDropdown
          tags={tags}
          handleTagClick={handleTagClick}
          setShowTagMenu={setShowTagMenu}
        />
      )}
      {showCreateTaskWindow && (
        <CreateTaskWindow
          currentCard={viewingCard}
          setShowTaskWindow={setShowCreateTaskWindow}
        />
      )}
    </div>
  );
}
