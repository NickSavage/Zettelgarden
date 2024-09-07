import React, { useState, useEffect } from "react";
import { getAllFiles } from "../api/files";
import { sortCards } from "../utils/cards";
import { FileRenameModal } from "../components/files/FileRenameModal";
import { FileListItem } from "../components/files/FileListItem";
import { FilterInput } from "../components/FilterInput";

import { File } from "../models/File";
import { H6 } from "../components/Header";

export function FileVault() {
  const [files, setFiles] = useState<File[]>([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const [refreshFiles, setRefreshFiles] = useState<boolean>(false);
  const [filterString, setFilterString] = useState<string>("");

  function onDelete(file_id: number) {
    setFiles(files.filter((file) => file.id !== file_id));
  }

  function handleFilter(text: string) {
    setFilterString(text);
  }

  function filterFiles(file: File) {
    if (filterString === "") {
      return file;
    }
    return file.name.toLowerCase().includes(filterString.toLowerCase());
  }

  function onRename(fileId: number, updatedFile: File) {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f)),
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
      <div className="bg-slate-200 p-2 border-slate-400 border">
        <FilterInput handleFilterHook={handleFilter} />
      </div>
      <FileRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={onRename}
        file={fileToRename}
      />
      <div className="p-4">
        {files && files.length > 0 ? (
          <ul>
            {files.filter(filterFiles).map((file, index) => (
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
      </div>
    </>
  );
}
