import React, { DragEventHandler, useState, useRef, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export interface CardBodyTextAreaHandle {
  formatText: (formatType: string) => void;
  togglePreviewMode: () => void;
}

export const CardBodyTextArea = forwardRef<CardBodyTextAreaHandle, CardBodyTextAreaProps>(({
  editingCard,
  setEditingCard,
  setMessage,
  newCard,
  filesToUpdate,
  setFilesToUpdate,
}: CardBodyTextAreaProps, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLinkMode, setIsLinkMode] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>("");
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const { partialCards } = usePartialCardContext();
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      const textarea = event.currentTarget;
      const { value, selectionStart } = textarea;

      // Find the start of the current line
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(currentLineStart, selectionStart);

      // Check if the current line starts with a bullet point (possibly with indentation)
      const bulletMatch = currentLine.match(/^(\s*)-\s+/);

      if (bulletMatch) {
        event.preventDefault();

        // Extract the indentation and bullet format
        const indentation = bulletMatch[1] || '';
        const bulletFormat = '- ';

        // Insert a new line with the same bullet format
        const newText = `\n${indentation}${bulletFormat}`;

        // Update the text and position the cursor after the bullet point
        const newBody =
          value.substring(0, selectionStart) +
          newText +
          value.substring(selectionStart);

        setEditingCard({ ...editingCard, body: newBody });

        // Position cursor after the bullet point on the new line
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + newText.length,
            selectionStart + newText.length
          );
        }, 0);
      }
    }
  };

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

  // Format text function for the markdown toolbar
  const formatText = (formatType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editingCard.body.substring(start, end);
    const currentLineStart = editingCard.body.lastIndexOf('\n', start - 1) + 1;
    const currentLineEnd = editingCard.body.indexOf('\n', end);
    const currentLine = editingCard.body.substring(
      currentLineStart,
      currentLineEnd === -1 ? editingCard.body.length : currentLineEnd
    );

    let formattedText = selectedText;
    let newCursorStart = start;
    let newCursorEnd = end;
    let newBody = editingCard.body;

    switch (formatType) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        }
        break;

      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = end + 1;
        }
        break;

      case 'h1':
        if (currentLine.trim() === selectedText.trim()) {
          // If the selected text is the entire line, prepend with heading
          formattedText = `# ${selectedText}`;
          newBody =
            editingCard.body.substring(0, currentLineStart) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        } else if (selectedText) {
          // Add a newline and heading before selection
          formattedText = `\n# ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 3;
          newCursorEnd = end + 3;
        }
        break;

      case 'h2':
        if (currentLine.trim() === selectedText.trim()) {
          formattedText = `## ${selectedText}`;
          newBody =
            editingCard.body.substring(0, currentLineStart) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 3;
          newCursorEnd = end + 3;
        } else if (selectedText) {
          formattedText = `\n## ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 4;
          newCursorEnd = end + 4;
        }
        break;

      case 'h3':
        if (currentLine.trim() === selectedText.trim()) {
          formattedText = `### ${selectedText}`;
          newBody =
            editingCard.body.substring(0, currentLineStart) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 4;
          newCursorEnd = end + 4;
        } else if (selectedText) {
          formattedText = `\n### ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 5;
          newCursorEnd = end + 5;
        }
        break;

      case 'bulletList':
        if (selectedText.includes('\n')) {
          // Multi-line selection: add bullet to each line
          const lines = selectedText.split('\n');
          formattedText = lines.map(line => `- ${line}`).join('\n');
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + formattedText.length;
        } else if (selectedText) {
          formattedText = `- ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        }
        break;

      case 'numberList':
        if (selectedText.includes('\n')) {
          // Multi-line selection: add numbers to each line
          const lines = selectedText.split('\n');
          formattedText = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 3; // "1. " is 3 characters
          newCursorEnd = start + formattedText.length;
        } else if (selectedText) {
          formattedText = `1. ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 3;
          newCursorEnd = end + 3;
        }
        break;

      case 'code':
        if (selectedText.includes('\n')) {
          // Multi-line selection: add code block
          formattedText = "```\n" + selectedText + "\n```";
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 4; // "```\n" is 4 characters
          newCursorEnd = end + 4;
        } else if (selectedText) {
          // Single line: inline code
          formattedText = "`" + selectedText + "`";
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = end + 1;
        }
        break;

      case 'quote':
        if (selectedText.includes('\n')) {
          // Multi-line selection: add quote to each line
          const lines = selectedText.split('\n');
          formattedText = lines.map(line => `> ${line}`).join('\n');
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + formattedText.length;
        } else if (selectedText) {
          formattedText = `> ${selectedText}`;
          newBody =
            editingCard.body.substring(0, start) +
            formattedText +
            editingCard.body.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        }
        break;

      default:
        return;
    }

    if (selectedText) {
      setEditingCard({ ...editingCard, body: newBody });

      // Re-focus and set selection to maintain cursor position after the formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          newCursorStart,
          newCursorEnd
        );
      }, 0);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    formatText,
    togglePreviewMode: () => {
      setIsPreviewMode(prev => !prev);
    }
  }));

  return (
    <div>
      {isPreviewMode ? (
        <div className="prose block w-full h-48 p-2 border border-gray-200 overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {editingCard.body}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="block w-full h-48 p-2 border border-gray-200"
          id="body"
          value={editingCard.body}
          onChange={handleBodyChange}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
          placeholder="Body"
        />
      )}
      {isLinkMode && !isPreviewMode && ( // Only show link suggestions in edit mode
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
});
