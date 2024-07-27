import { File } from "../../models/File";
import { renderFile, deleteFile } from "../../api/files";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { FileIcon } from "../../assets/icons/FileIcon";

interface FileListItemProps {
  file: File;
  onDelete: (file_id: number) => void;
  handleViewCard: (card_pk: number) => void;
  openRenameModal: (file: File) => void;
}

export function FileListItem({
  file,
  onDelete,
  handleViewCard,
  openRenameModal,
}: FileListItemProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  function toggleMenu() {
    setShowMenu(!showMenu);
  }
  const handleFileDownload = (file: File, e: React.MouseEvent) => {
    e.preventDefault();
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
          <FileIcon />
          <a href="#" onClick={(e) => handleFileDownload(file, e)}>
            <span className="font-bold">{file.name}</span>
          </a>
          <br />
          <span className="text-xs">Created At: {file.created_at}</span>
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
                <button onClick={() => openRenameModal(file)}>Rename</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
