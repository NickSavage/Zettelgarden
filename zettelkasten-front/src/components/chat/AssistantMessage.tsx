import React from "react";
import Markdown from "react-markdown";

interface AssistantMessageProps {
  message: string;
  isStreaming?: boolean;
}

export function AssistantMessage({
  message,
  isStreaming,
}: AssistantMessageProps) {
  return (
    <div className={`${isStreaming ? "animate-pulse" : ""}`}>
      <Markdown>{message}</Markdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-blink">
          |
        </span>
      )}
    </div>
  );
}
