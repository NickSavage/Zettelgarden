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
import { FileListItem } from "./FileListItem";

import { useNavigate } from "react-router-dom";

export function FileVault() {
  const [files, setFiles] = useState([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const navigate = useNavigate();

  function handleCardClick(id) {
    navigate(`/app/card/${id}`);
  }
  const openRenameModal = (file) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  };

  function onDelete(file_id) {
    setFiles(files.filter((file) => file.id !== file_id));
  }

  function onRename(fileId, updatedFile) {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f)),
    );
    setIsRenameModalOpen(false);
  }

  useEffect(() => {
    document.title = "Zettelgarden - Files";
    getAllFiles().then((data) => setFiles(sortCards(data, "sortNewOld")));
  }, []);
  return (
    <>
      <FileRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={onRename}
        file={fileToRename}
      />
      <h3>File Vault</h3>
      {files && files.length > 0 ? (
        <ul>
          {files.map((file, index) => (
            <FileListItem
              key={file.id} // Assuming each file has a unique `id` property
              file={file}
              onDelete={onDelete}
              handleViewCard={handleCardClick}
              openRenameModal={openRenameModal}
              displayCard={true}
            />
          ))}
        </ul>
      ) : (
        <p>No files to display.</p> // Custom message when files array is empty
      )}
    </>
  );
}
