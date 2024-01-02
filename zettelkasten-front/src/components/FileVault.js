import React, { useState, useEffect } from "react";
import {
  renderFile,
  uploadFile,
  getAllFiles,
  deleteFile,
  editFile,
} from "../api";
import { sortCards } from "../utils";
import { FileRenameModal } from "./FileRenameModal.js";

export function FileVault({ handleViewCard }) {
  const [files, setFiles] = useState([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);

  const handleFileDownload = (fileId, e) => {
    e.preventDefault();
    renderFile(fileId).catch((error) => {
      console.error("Error downloading file:", error);
    });
  };
  const openRenameModal = (file) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  };
  const handleFileDelete = (fileId, e) => {
    e.preventDefault();

    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFile(fileId)
        .then(() => {
          setFiles(files.filter((file) => file.id !== fileId));
        })
        .catch((error) => {
          console.error("Error deleting file:", error);
        });
    }
  };

  useEffect(() => {
    getAllFiles().then((data) => setFiles(sortCards(data, "sortNewOld")));
  }, []);
  return (
    <>
      <FileRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={(file, newName) => {
          // Handle the renaming logic here
          editFile(file["id"], { name: newName })
            .then((updatedFile) => {
              console.log("File successfully updated", updatedFile);
              // Update the local state to reflect the changed file
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.id === updatedFile.id ? updatedFile : f,
                ),
              );
            })
            .catch((error) => {
              console.error("Error updating file:", error);
            });

          console.log(newName);
          setIsRenameModalOpen(false);
        }}
        file={fileToRename}
      />
      <h3>File Vault</h3>
      <ul>
        {files &&
          files.map((file, index) => (
            <li key={file.id}>
              <div className="file-item">
                <div className="file-item-left">
                  {" "}
                  {/* Ensure file.id is unique */}
                  <span>{file.id} - </span>
                  <a href="#" onClick={(e) => handleFileDownload(file.id, e)}>
                    {file.name}
                  </a>
                  <br />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewCard(file["card"]);
                    }}
                    style={{ color: "black", textDecoration: "none" }}
                  >
                    <span style={{ color: "blue", fontWeight: "bold" }}>
                      {file["card"]["card_id"]}
                    </span>
                    <span>: {file["card"]["title"]} </span>
                  </a>
                  <br />
                  <span>Created At: {file["created_at"]}</span>
                </div>
                <div className="file-item-right">
                  <button
                    className="btn"
                    onClick={(e) => openRenameModal(file)}
                  >
                    Rename
                  </button>
                  <button
                    className="btn"
                    onClick={(e) => handleFileDelete(file.id, e)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </>
  );
}
