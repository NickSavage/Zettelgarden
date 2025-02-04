import React from "react";
import Markdown from "react-markdown";
import { ChatCompletion } from "../../models/Chat";
import { CardItem } from "../../components/cards/CardItem";

interface AssistantMessageProps {
  message: ChatCompletion;
  isStreaming?: boolean;
}

const CardBlock = ({ children }: { children: string }) => {
  try {
    const cleanContent = children.replace(/`*$/, '').trim();
    const jsonContent = JSON.parse(cleanContent);
    return (
      <pre className="text-red-500 p-2 rounded bg-red-50 whitespace-pre-wrap break-words">
        {JSON.stringify(jsonContent, null, 2)}
      </pre>
    );
  } catch (e) {
    return <pre className="text-red-500 p-2 rounded bg-red-50 whitespace-pre-wrap break-words">{children}</pre>;
  }
};


export function AssistantMessage({
  message,
  isStreaming,
}: AssistantMessageProps) {
  return (
    <div className={`text-sm ${isStreaming ? "animate-pulse" : ""}`}>
      <Markdown
        components={{
          code: ({ className, children, ...props }) => {
            // Check if this is a card block
            const isCard = (className || '').includes('card');
            if (isCard) {
              return <CardBlock>{String(children)}</CardBlock>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.content}
      </Markdown>
      <div>
        <ul>
          {message.cards &&
            message.cards.map((card, index) => (
              <li key={index}>
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
