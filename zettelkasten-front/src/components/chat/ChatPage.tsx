import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../../assets/icons/StopIcon";

import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface ChatPageProps {}

export function ChatPage({}: ChatPageProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }
  function handleQuery() {
    setIsLoading(true);
  }

  function handleStop() {}

  return (
    <div>
      <AssistantMessage message="hello world" />
      <UserMessage
        message={
          "I want you to work on another component now. it should look something"
        }
      />
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={handleQuery}
        >
          +
        </button>
        <input
          className="w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
          type="text"
          id="title"
          value={query}
          placeholder="How can I help you today?"
          onChange={handleSearchUpdate}
          onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              handleQuery();
            }
          }}
        />
        {isLoading && (
          <button
            className="bg-black text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium hover:bg-gray-800"
            onClick={handleStop}
          >
            <StopIcon />
          </button>
        )}
      </div>
    </div>
  );
}
