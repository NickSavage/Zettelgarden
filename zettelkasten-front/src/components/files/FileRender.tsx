import React, { useEffect, useState } from "react";
import { File } from "../../models/File";
import { downloadFile } from "../../api/files";

interface FileRenderProps {
  file: File;
}

export const FileRender = ({ file }: FileRenderProps) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  useEffect(() => {
    if (file.id) {
      downloadFile(file.id.toString())
        .then((blobUrl) => {
          if (blobUrl) {
            setImageSrc(blobUrl);
          }
        })
        .catch((error) => {
          console.error("Error fetching image:", error);
        });
    }
  }, [file]);
  return (
    <div className="file-render-popup-overlay">
      <div className="file-render-popup-content">
        {(file.filetype === "image/png" || file.filetype === "image/jpeg") && (
          <img src={imageSrc} style={{ maxWidth: "100%", height: "auto" }} />
        )}
      </div>
    </div>
  );
};
