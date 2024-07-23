import React, { useState, useEffect } from "react";

import { editFile } from "../../api/files";
import { File } from "../../models/File";

interface FileRenameModal {
  isOpen: boolean;
  onClose: () => void;
  onRename: (file_id: number, updatedFile: File) => void;
  file: File | null;
}

export function FileRenameModal({
  isOpen,
  onClose,
  onRename,
  file,
}: FileRenameModal) {
  const [newName, setNewName] = useState("");

  function handleRename() {
    if (file === null) {
      return;
    }
    console.log("handleRename");
    editFile(file["id"].toString(), { name: newName })
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
