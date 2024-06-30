import { File } from "../models/File";
import { Card } from "../models/Card";
import { renderFile, deleteFile } from "../api/files";
import React from "react";

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
  const handleFileDownload = (file: File, e: React.MouseEvent) => {
    e.preventDefault();
    renderFile(file.id, file.name).catch((error) => {
      console.error("Error downloading file:", error);
    });
  };
  const handleFileDelete = (file_id: number, e: React.MouseEvent) => {
    e.preventDefault();

    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFile(file_id)
        .then(() => {
          onDelete(file_id);
        })
        .catch((error) => {
          console.error("Error deleting file:", error);
        });
    }
  };
  console.log(file.created_at); // Check the type and value
  return (
    <li key={file.id}>
      <div className="file-item">
        <div className="file-item-left">
          {" "}
          {/* Ensure file.id is unique */}
          <span>{file.id} - </span>
          <a href="#" onClick={(e) => handleFileDownload(file, e)}>
            {file.name}
          </a>
          <br />
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleViewCard(file["card"]["id"]);
              }}
              style={{ color: "black", textDecoration: "none" }}
            >
              <span style={{ color: "blue", fontWeight: "bold" }}>
                {file["card"]["card_id"]}
              </span>
              <span>: {file["card"]["title"]} </span>
            </a>

            <br />
          </div>
          <span>Created At: {file.created_at}</span>
        </div>
        <div className="file-item-right">
          <button className="btn" onClick={(e) => openRenameModal(file)}>
            Rename
          </button>
          <button className="btn" onClick={(e) => handleFileDelete(file.id, e)}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
