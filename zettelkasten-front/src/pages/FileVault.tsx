import React, { useState, ChangeEvent, useEffect } from "react";
import { getAllFiles } from "../api/files";
import { sortCards } from "../utils/cards";
import { FileRenameModal } from "../components/files/FileRenameModal";
import { FileListItem } from "../components/files/FileListItem";
import { FileUpload } from "../components/files/FileUpload";
import { Button } from "../components/Button";
import { useFileContext } from "../contexts/FileContext";

import { File } from "../models/File";
import { defaultCard } from "../models/Card";
import { H6 } from "../components/Header";

const ITEMS_PER_PAGE = 20;

export function FileVault() {
  const [files, setFiles] = useState<File[]>([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const [filterString, setFilterString] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterHelp, setShowFilterHelp] = useState<boolean>(false); // Added state for tooltip
  const { refreshFiles, setRefreshFiles } = useFileContext();

  function onDelete(file_id: number) {
    setFiles(files.filter((file) => file.id !== file_id));
  }

  function handleFilter(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFilterString(e.target.value);
  }

  function filterFiles(file: File) {
    if (filterString === "") {
      return file;
    }

    // Check if we're filtering by filetype
    const filetypeMatch = filterString.match(/filetype:([^\s]+)/i);

    if (filetypeMatch) {
      const filetype = filetypeMatch[1];
      // Get the rest of the filter string without the filetype part
      const nameFilterString = filterString.replace(/filetype:[^\s]+/i, "").trim();

      // Filter by both filetype and name
      return (
        file.filetype === filetype &&
        (nameFilterString === "" || file.name.toLowerCase().includes(nameFilterString.toLowerCase()))
      );
    }

    // Default behavior - just filter by name
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
        <div className="relative flex items-center mb-2"> {/* Container for input and icon */}
          <input
            type="text"
            value={filterString}
            onChange={handleFilter}
            placeholder="Filter files (e.g., report or filetype:pdf)"
            className="w-full p-1 border border-slate-400 rounded" // Added styling
          />
          <span
            className="ml-2 cursor-pointer text-slate-500 hover:text-slate-700"
            onMouseEnter={() => setShowFilterHelp(true)}
            onMouseLeave={() => setShowFilterHelp(false)}
            aria-label="Filter help"
          >
            ?
          </span>
          {showFilterHelp && (
            <div className="absolute top-full mt-2 left-0 bg-white p-3 border border-slate-300 rounded shadow-lg z-20 w-auto min-w-[300px]">
              <h4 className="font-semibold mb-2 text-slate-700">Filter Options:</h4>
              <ul className="list-none space-y-1 text-sm text-slate-600">
                <li><strong>Filename:</strong> Searches file names (e.g., <code>annual-report</code>).</li>
                <li><strong>Filetype:</strong> <code>filetype:TYPE</code> (e.g., <code>filetype:pdf</code>, <code>filetype:image/jpeg</code>).</li>
                <li>Combine by adding text after filetype (e.g., <code>filetype:pdf quarterly</code>).</li>
              </ul>
            </div>
          )}
        </div>
        <FileUpload
          setMessage={(message: string) => { }}
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
          <>
            {/* Show filtered file count */}
            <div className="text-sm text-slate-600 mb-2">
              Showing {files.filter(filterFiles).length} of {files.length} files
            </div>

            <ul>
              {files
                .filter(filterFiles)
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((file, index) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onDelete={onDelete}
                    setRefreshFiles={setRefreshFiles}
                    filterString={filterString}
                    setFilterString={setFilterString}
                  />
                ))}
            </ul>
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(files.filter(filterFiles).length / ITEMS_PER_PAGE)}
              </span>
              <Button
                onClick={() => setCurrentPage(prev =>
                  Math.min(Math.ceil(files.filter(filterFiles).length / ITEMS_PER_PAGE), prev + 1)
                )}
                disabled={currentPage >= Math.ceil(files.filter(filterFiles).length / ITEMS_PER_PAGE)}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p>No files to display.</p>
        )}
      </div>
    </>
  );
}
