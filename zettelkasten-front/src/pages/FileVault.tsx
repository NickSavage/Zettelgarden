import React, { useState, useEffect } from "react";
import { getAllFiles } from "../api/files";
import { sortCards } from "../utils";
import { FileRenameModal } from "../components/files/FileRenameModal";
import { FileListItem } from "../components/files/FileListItem";

import { File } from "../models/File";
import { H6 } from "../components/Header";

export function FileVault() {
  const [files, setFiles] = useState<File[]>([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const [refreshFiles, setRefreshFiles] = useState<boolean>(false);

  function onDelete(file_id: number) {
    setFiles(files.filter((file) => file.id !== file_id));
  }

  function onRename(fileId: number, updatedFile: File) {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f))
    );
    setIsRenameModalOpen(false);
  }
  useEffect(() => {
    console.log("refresh?");
    if (refreshFiles) {
      console.log("refresh!");
      getAllFiles().then((data) => setFiles(sortCards(data, "sortNewOld")));
      setRefreshFiles(false);
    }
  }, [refreshFiles]);

  useEffect(() => {
    document.title = "Zettelgarden - Files";
    setRefreshFiles(true);
  }, []);
  return (
    <>
      <div className="mb-4">
        <H6 children="File Vault" />
      </div>
      <FileRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={onRename}
        file={fileToRename}
      />
      {files && files.length > 0 ? (
        <ul>
          {files.map((file, index) => (
            <FileListItem
              file={file}
              onDelete={onDelete}
              setRefreshFiles={setRefreshFiles}
            />
          ))}
        </ul>
      ) : (
        <p>No files to display.</p> // Custom message when files array is empty
      )}
    </>
  );
}
