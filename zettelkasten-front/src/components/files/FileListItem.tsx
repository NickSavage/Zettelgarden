import { File } from "../../models/File";
import { renderFile, deleteFile, editFile } from "../../api/files";
import { Link } from "react-router-dom";
import React, { useState, KeyboardEvent } from "react";
import { FileIcon } from "../../assets/icons/FileIcon";
import { FileRender } from "./FileRender";

interface FileListItemProps {
  file: File;
  onDelete: (file_id: number) => void;
  setRefreshFiles: (refresh: boolean) => void;
}

export function FileListItem({
  file,
  onDelete,
  setRefreshFiles,
}: FileListItemProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [showEditName, setShowEditName] = useState<boolean>(false);
  const [renderImage, setRenderImage] = useState<boolean>(false);

  function toggleMenu() {
    setShowMenu(!showMenu);
  }
  function toggleEditName() {
    setNewName(file.name);
    setShowEditName(!showEditName);
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
            <span className="text-xs">Created At: {file.created_at}</span>
          </div>
        </div>

        <div className="file-item-right">
          <div>
            <Link
              to={`/app/card/${file.card.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="card-id">[{file.card.card_id}]</span>
            </Link>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
