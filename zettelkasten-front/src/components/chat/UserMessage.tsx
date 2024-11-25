import React from "react";

interface UserMessageProps {
  message: string;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div>
      <div className="bg-gray-50 rounded-lg p-4 my-4 ml-40">
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
