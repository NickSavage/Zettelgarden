import { File } from "../../models/File";
import { PartialCard } from "../../models/Card";
import { renderFile, deleteFile, editFile } from "../../api/files";
import { Link } from "react-router-dom";
import React, { useState, KeyboardEvent } from "react";
import { FileIcon } from "../../assets/icons/FileIcon";
import { FileRender } from "./FileRender";

import { BacklinkInput } from "../cards/BacklinkInput";

interface FileListItemProps {
  file: File;
  onDelete: (file_id: number) => void;
  setRefreshFiles: (refresh: boolean) => void;
  displayFileOnCard?: (file: File) => void;
  filterString: string;
  setFilterString: (text: string) => void;
}

export function FileListItem({
  file,
  onDelete,
  setRefreshFiles,
  displayFileOnCard,
  filterString,
  setFilterString,
}: FileListItemProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [showEditName, setShowEditName] = useState<boolean>(false);
  const [renderImage, setRenderImage] = useState<boolean>(false);

  const [showCardLink, setShowCardLink] = useState<boolean>(false);

  function toggleMenu() {
    setShowMenu(!showMenu);
  }
  function toggleEditName() {
    setNewName(file.name);
    setShowEditName(!showEditName);
    setShowMenu(false);
  }
  function handleTitleEdit() {
    editFile(file["id"].toString(), { name: newName, card_pk: file.card_pk });
    toggleEditName();
    setRefreshFiles(true);
  }
  function closeRenderImage() {
    setRenderImage(false);
  }
  const handleFileDownload = (file: File, e: React.MouseEvent) => {
    e.preventDefault();
    if (file.filetype === "image/png" || file.filetype === "image/jpeg") {
      setRenderImage(true);
      return;
    }
    renderFile(file.id, file.name).catch((error) => {
      console.error("Error downloading file:", error);
    });
  };
  const handleFileDelete = (file_id: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFile(file_id)
        .then(() => {
          onDelete(file_id);
        })
        .catch((error) => {
          console.error("Error deleting file:", error);
        });
    }
    setShowMenu(false);
  };

  async function handleBacklink(card: PartialCard) {
    editFile(file["id"].toString(), { name: file.name, card_pk: card.id }).then(
      (file) => {
        setShowCardLink(false);
        setShowMenu(false);
        setRefreshFiles(true);
      },
    );
  }

  function toggleCardLink() {
    setShowCardLink(!showCardLink);
    setShowMenu(false);
  }

  function onFileTypeClick(file: File) {
    setFilterString("filetype:" + file.filetype)
  }

  async function handleCardUnlink() {
    editFile(file["id"].toString(), { name: file.name, card_pk: -1 }).then(
      (file) => {
        setShowCardLink(false);
        setShowMenu(false);
        setRefreshFiles(true);
      },
    );
    setShowMenu(false);
  }

  async function handleDisplayCardClick() {
    if (!displayFileOnCard) {
      return
    }
    displayFileOnCard(file)
    setRefreshFiles(true);
    setShowMenu(false);
  }

  return (
    <li key={file.id}>
      <div className="flex">
        <div className="flex-grow">
          <div className="flex items-center">
            <FileIcon />
            {showEditName ? (
              <input
                className="task-list-item-title-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    handleTitleEdit();
                  }
                }}
              />
            ) : (
              <div>
                <a
                  href="#"
                  onClick={(e) => handleFileDownload(file, e)}
                  className="ml-2"
                >
                  <span className="font-bold">{file.name}</span>
                </a>
                {renderImage && (
                  <div onClick={closeRenderImage}>
                    <FileRender file={file} />
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <span className="text-xs">
              Created At: {String(file.created_at)}
            </span>
          </div>
        </div>

        <div className="file-item-right">
          <div
            className="text-sm pr-4 cursor-pointer"
            onClick={() => onFileTypeClick(file)}
          >{file.filetype}</div>
          <div>
            {file.card_pk > 0 && (
              <Link
                to={`/app/card/${file.card.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="card-id">[{file.card.card_id}]</span>
              </Link>
            )}

            {!file.card ||
              (file.card.id == 0 && (
                <div>
                  {showCardLink && (
                    <BacklinkInput addBacklink={handleBacklink} />
                  )}
                </div>
              ))}
          </div>
          <div className="dropdown">
            <button onClick={toggleMenu} className="menu-button">
              ⋮
            </button>
            {showMenu && (
              <div className="popup-menu">
                <button onClick={() => handleFileDelete(file.id)}>
                  Delete
                </button>
                <button onClick={() => toggleEditName()}>Rename</button>

                {file.card_pk <= 1 ? (
                  <button onClick={() => toggleCardLink()}>Link Card</button>
                ) : (
                  <button onClick={() => handleCardUnlink()}>
                    Unlink Card
                  </button>
                )}
                {displayFileOnCard && file.filetype.includes("image") && (
                  <button onClick={() => handleDisplayCardClick()}>Display File on Card</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
