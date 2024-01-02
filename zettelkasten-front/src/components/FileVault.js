import React, { useState, useEffect } from "react";
import { renderFile, uploadFile, getAllFiles } from "../api";

export function FileVault({}) {
    const [files, setFiles] = useState([]);
  const handleFileDownload = (fileId, e) => {
    e.preventDefault(); // Prevent the default anchor behavior
    renderFile(fileId).catch((error) => {
      // Handle any errors here, such as displaying a notification to the user
      console.error("Error downloading file:", error);
    });
  };


    useEffect(() => {
	getAllFiles().then(data => setFiles(data));
    }, [])
        return (
        <>
            <h3>File Vault</h3>
            <ul>
                {files && files.map((file, index) => (
                    <li key={file.id}> {/* Ensure file.id is unique */}
                        <span>{file.id} - </span>
                        <a href="#" onClick={(e) => handleFileDownload(file.id, e)}>
                            {file.name}
                        </a>
                    </li>
                ))}
            </ul>
        </>
    );
}
