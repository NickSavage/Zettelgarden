import React, { DragEventHandler, useState } from "react";
import { PartialCard, Card } from "../../models/Card";
import { File } from "../../models/File";
import { uploadFile } from "../../api/files";
import { findWordBoundaries } from "../../utils/strings";
import { usePartialCardContext } from "../../contexts/CardContext";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";
import { quickFilterCards } from "../../utils/cards";

interface CardBodyTextAreaProps {
  editingCard: Card;
  setEditingCard: (card: Card) => void;
  setMessage: (message: string) => void;
  newCard: boolean;
  filesToUpdate: File[];
  setFilesToUpdate: (files: File[]) => void;
}

export function CardBodyTextArea({
  editingCard,
  setEditingCard,
  setMessage,
  newCard,
  filesToUpdate,
  setFilesToUpdate,
}: CardBodyTextAreaProps) {
  const [isLinkMode, setIsLinkMode] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>("");
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const { partialCards } = usePartialCardContext();

  function handleSearch(searchTerm: string) {
    if (searchTerm !== "") {
      let results = quickFilterCards(partialCards, searchTerm);
      setTopResults(results);
    } else {
      setTopResults([]);
    }
    setLinkText(searchTerm);
  }

  function handleBodyChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const inputValue = event.target.value;
    const newCursorPosition = event.target.selectionStart;
    setCursorPosition(newCursorPosition);

    let word = "";

    try {
      const wordBoundaries = findWordBoundaries(inputValue, newCursorPosition);
      word = inputValue.slice(wordBoundaries.start, wordBoundaries.end);
      setCursorPosition(wordBoundaries.start);
    } catch (error) {
      // Log the error if needed
      console.error("Error finding word boundaries:", error);
      // Do nothing and continue execution
    }

    let processedWord = word;

    if (word.startsWith("[")) {
      processedWord = word.slice(1); // Remove the preceding `[`
    }
    if (processedWord.endsWith("]")) {
      processedWord = processedWord.slice(0, -1); // Remove the final `]`
    }

    if (word.startsWith("[")) {
      setLinkText(processedWord);
      setIsLinkMode(true);

      // Adding console logs to debug
      // Check filtered results

      let results = quickFilterCards(partialCards, processedWord);
      setTopResults(results);
      console.log("results", results);
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
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        const file = event.dataTransfer.files[i];
        if (file.type.startsWith("image/")) {
          try {
            // Create a sanitized filename based on card title
            const sanitizedTitle = editingCard.title
              .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric chars with dashes
              .replace(/-+/g, '-') // Replace multiple dashes with single dash
              .trim();
            
            // Add timestamp and index to ensure uniqueness
            const timestamp = new Date().getTime();
            const customFilename = `${sanitizedTitle}-${timestamp}-${i}`;
            
            const response = await uploadFile(file, editingCard.id, customFilename);

            if ("error" in response) {
              setMessage("Error uploading file: " + response["message"]);
            } else {
              setMessage(
                "File uploaded successfully: " + response["file"]["name"],
              );
              setFilesToUpdate([...filesToUpdate, response.file]);
            }
          } catch (error) {
            setMessage("Error uploading file: " + error);
          }
        }
      }
    }
  };

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.clipboardData && event.clipboardData.items) {
      const items = Array.from(event.clipboardData.items);
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault(); // Prevent default only for images
          const file = item.getAsFile();

          try {
            // Use title or default to "image" if title is blank
            const baseTitle = editingCard.title.trim() || "image";
            
            // Create a sanitized filename based on card title
            const sanitizedTitle = baseTitle
              .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric chars with dashes
              .replace(/-+/g, '-') // Replace multiple dashes with single dash
              .trim();
            
            // Add timestamp to ensure uniqueness
            const timestamp = new Date().getTime();
            const customFilename = `${sanitizedTitle}-${timestamp}`;
            
            const response = await uploadFile(file!, editingCard.id, customFilename);

            if ("error" in response) {
              setMessage("Error uploading file: " + response["message"]);
            } else {
              setFilesToUpdate([...filesToUpdate, response.file]);
              let append_text = "\n\n![](" + response["file"]["id"] + ")";
              setMessage(
                `File uploaded successfully: ${response["file"]["name"]}`,
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
      }
    }
  };

  function handleDropdownClick(card: PartialCard) {
    let append_text = "[" + card.card_id + "]";
    append_text.trim();
    let updatedBody = editingCard.body;
    if (cursorPosition === null) {
      updatedBody = updatedBody + "\n\n" + append_text;
    } else {
      updatedBody =
        editingCard.body.slice(0, cursorPosition) +
        append_text +
        editingCard.body.slice(cursorPosition + linkText.length);
    }
    console.log(editingCard.body);
    console.log(updatedBody);
    let prevEditingCard = {
      ...editingCard,
      body: updatedBody,
    };
    setEditingCard(prevEditingCard);
    setIsLinkMode(false);
    setLinkText("");
  }

  return (
    <div>
      <textarea
        className="block w-full h-48 p-2 border border-gray-200"
        id="body"
        value={editingCard.body}
        onChange={handleBodyChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
        placeholder="Body"
      />
      {isLinkMode && (
        <div>
          {topResults.length > 0 && (
            <div className="absolute top-auto left-1/2 w-1/4 p-4 bg-white border border-gray-200 z-10 shadow">
              <BacklinkInputDropdownList
                onSelect={handleDropdownClick}
                onSearch={handleSearch}
                cards={topResults}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
