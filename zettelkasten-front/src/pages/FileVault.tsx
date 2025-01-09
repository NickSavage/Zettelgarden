import React, { useState, useEffect } from "react";
import { getAllFiles } from "../api/files";
import { sortCards } from "../utils/cards";
import { FileRenameModal } from "../components/files/FileRenameModal";
import { FileListItem } from "../components/files/FileListItem";
import { FileUpload } from "../components/files/FileUpload";
import { FilterInput } from "../components/FilterInput";
import { Button } from "../components/Button";
import { useFileContext } from "../contexts/FileContext";

import { File } from "../models/File";
import { defaultCard } from "../models/Card";
import { H6 } from "../components/Header";

export function FileVault() {
  const [files, setFiles] = useState<File[]>([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const [filterString, setFilterString] = useState<string>("");
  const { refreshFiles, setRefreshFiles } = useFileContext();

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
    if (refreshFiles) {
      getAllFiles().then((data) => {
        // Sort files by created_at date (newest first)
        const sortedFiles = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFiles(sortedFiles);
      });
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

        <FileUpload
          setMessage={(message: string) => {}}
          card={defaultCard}
        >
          <Button>Select File To Upload</Button>
        </FileUpload>
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
                key={file.id}
                file={file}
                onDelete={onDelete}
                setRefreshFiles={setRefreshFiles}
              />
            ))}
          </ul>
        ) : (
          <p>No files to display.</p>
        )}
      </div>
    </>
  );
}
