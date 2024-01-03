import React, { useState, useEffect } from "react";

import { editFile } from "../api";

export function FileRenameModal({ isOpen, onClose, onRename, file }) {
  const [newName, setNewName] = useState("");

  function handleRename() {
      console.log("handleRename")
    editFile(file["id"], { name: newName })
      .then((updatedFile) => {
        onRename(file["id"], updatedFile);
      })
      .catch((error) => {
        console.error("Error updating file:", error);
      });

    console.log(newName);
  }

  useEffect(() => {
    if (isOpen && file) {
      setNewName(file["name"]);
    }
  }, [isOpen, file]);

  if (!isOpen) return null;
  console.log(file);
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={() => handleRename()}>Rename</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
