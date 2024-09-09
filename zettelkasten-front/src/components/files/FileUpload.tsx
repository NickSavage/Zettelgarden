import React, { useRef } from "react";

import { Card } from "../../models/Card";
import { uploadFile } from "../../api/files";
import { Button } from "../../components/Button";

interface FileUploadProps {
  setRefresh: (refresh:boolean) => void;
  setMessage: (message: string) => void;
  card: Card;
}

export function FileUpload({ setRefresh, setMessage, card }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        try {
          const response = await uploadFile(files[i], card.id);
          if ("error" in response) {
            setMessage("Error uploading file: " + response["message"]);
          } else {
            setMessage(
              "File uploaded successfully: " + response["file"]["name"],
            );
	    setRefresh(true);
          }
        } catch (error) {
          setMessage("Error uploading file: " + error);
        }
      }
    }
  };
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  return (
    <div>
      <Button onClick={handleButtonClick} children={"Select File to Upload"} />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
        multiple // Optional: allows multiple file selection
      />
    </div>
  );
}
