import React from "react";
import Markdown from "react-markdown";
import { ChatCompletion } from "../../models/Chat";
import { CardItem } from "../../components/cards/CardItem";

interface AssistantMessageProps {
  message: ChatCompletion;
  isStreaming?: boolean;
}

export function AssistantMessage({
  message,
  isStreaming,
}: AssistantMessageProps) {
  return (
    <div className={`text-sm ${isStreaming ? "animate-pulse" : ""}`}>
      <Markdown>{message.content}</Markdown>
      <div>
        <ul>
          {message.cards &&
            message.cards.map((card) => (
              <li>
                <CardItem card={card} />
              </li>
            ))}
        </ul>
      </div>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-blink">
          |
        </span>
      )}
    </div>
  );
}
