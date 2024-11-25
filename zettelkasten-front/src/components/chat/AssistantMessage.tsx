import React from "react";

interface AssistantMessageProps {
  message: string;
}
export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div>
      <div className="flex flex-col gap-1 p-4 mx-20">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Zettelgarden</h2>
        </div>
        <div className="text-gray-600 mx-4">
          {message}
        </div>
      </div>
    </div>
  );
}
