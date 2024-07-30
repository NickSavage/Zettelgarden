import React, { DragEventHandler, useState } from "react";
import { Card } from "../../models/Card";
import { uploadFile } from "../../api/files";
import { findWordBoundaries } from "../../utils/strings";

interface CardBodyTextAreaProps {
  editingCard: Card;
  setEditingCard: (card: Card) => void;
  setMessage: (message: string) => void;
  newCard: boolean;
}

export function CardBodyTextArea({
  editingCard,
  setEditingCard,
  setMessage,
  newCard,
}: CardBodyTextAreaProps) {
  const [isLinkMode, setIsLinkMode] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleSelect = (event) => {
    setCursorPosition(event.target.selectionStart);
  };

  function handleBodyChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const inputValue = event.target.value;
    const newCursorPosition = event.target.selectionStart;

    const wordBoundaries = findWordBoundaries(inputValue, newCursorPosition);
    const word = inputValue.slice(wordBoundaries.start, wordBoundaries.end);

    if (word.startsWith("[")) {
      setLinkText(word);
      setIsLinkMode(true);
    } else {
      setLinkText("");
      setIsLinkMode(false);
    }

    setEditingCard({ ...editingCard, body: event.target.value });
  }

  const handleDragOver = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        try {
          const response = await uploadFile(files[i], editingCard.id);
          if ("error" in response) {
            setMessage("Error uploading file: " + response["message"]);
          } else {
            setMessage(
              "File uploaded successfully: " + response["file"]["name"]
            );
          }
        } catch (error) {
          setMessage("Error uploading file: " + error);
        }
      }
    }
  };

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.clipboardData && event.clipboardData.items) {
      const items = Array.from(event.clipboardData.items);
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault(); // Prevent default only for images
          const file = item.getAsFile();

          if (newCard) {
            setMessage(
              "Error: Cannot upload images for new cards, please save the card first"
            );
            return;
          }

          try {
            const response = await uploadFile(file!, editingCard.id);

            if ("error" in response) {
              setMessage("Error uploading file: " + response["message"]);
            } else {
              let append_text = "\n\n![](" + response["file"]["id"] + ")";
              setMessage(
                `File uploaded successfully: ${response["file"]["name"]}`
              );

              let prevEditingCard = {
                ...editingCard,
                body: editingCard.body + append_text,
              };
              setEditingCard(prevEditingCard);
            }
          } catch (error) {
            setMessage(`Error uploading file: ${error}`);
          }
        }
        // Remove the else if block for text/plain
      }
    }
  };
  return (
    <div>
      {isLinkMode && <span>{linkText}</span>}
      <textarea
        style={{ display: "block", width: "100%", height: "200px" }}
        className="border-2 p-2"
        id="body"
        value={editingCard.body}
        onChange={handleBodyChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
        placeholder="Body"
      />
    </div>
  );
}
