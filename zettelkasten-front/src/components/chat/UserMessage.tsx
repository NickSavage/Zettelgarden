import React from "react";
import Markdown from "react-markdown";

interface UserMessageProps {
  message: string;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div>
      <div className="bg-gray-50 rounded-lg p-4 my-4 ml-40">
        <div className="text-gray-700">
          <Markdown children={message} />
        </div>
      </div>
    </div>
  );
}
