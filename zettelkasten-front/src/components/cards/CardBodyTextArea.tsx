import React, { DragEventHandler, useState } from "react";
import { PartialCard, Card } from "../../models/Card";
import { uploadFile } from "../../api/files";
import { findWordBoundaries } from "../../utils/strings";
import { usePartialCardContext } from "../../contexts/CardContext";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";

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
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const { partialCards } = usePartialCardContext();

  function handleBodyChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const inputValue = event.target.value;
    const newCursorPosition = event.target.selectionStart;

    let word = "";

    try {
      const wordBoundaries = findWordBoundaries(inputValue, newCursorPosition);
      word = inputValue.slice(wordBoundaries.start, wordBoundaries.end);
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
      console.log("partialCards", partialCards);
      console.log("processedWord", processedWord);

      // Check filtered results
      const results = partialCards.filter((card) => {
        const cardIdLower = card.card_id.toLowerCase();
        const processedWordLower = processedWord.toLowerCase().trim();
        console.log(
          `Comparing card_id "${cardIdLower}" with processedWord "${processedWordLower}"`
        );
        return cardIdLower.startsWith(processedWordLower);
      });

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

  function handleDropdownClick(card: PartialCard) {
    let append_text = "\n\n[" + card.card_id + "] - " + card.title;
    let prevEditingCard = {
      ...editingCard,
      body: editingCard.body + append_text,
    };
    setEditingCard(prevEditingCard);
    setIsLinkMode(false);
    setLinkText("");
  }

  return (
    <div>
      <span>{linkText}</span>
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
      {isLinkMode && (
        <div>
          {" "}
          {topResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "auto",
                left: "25%",
                width: "25%",
                backgroundColor: "white",
                border: "1px solid black",
                zIndex: 1000,
                padding: "1rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <BacklinkInputDropdownList
                addBacklink={handleDropdownClick}
                cards={topResults}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
