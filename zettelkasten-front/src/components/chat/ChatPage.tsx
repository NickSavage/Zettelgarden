import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../../assets/icons/StopIcon";
import { postChatMessage, getUserConversations } from "../../api/chat";

import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface ChatPageProps {}
interface Message {
  role: string;
  content: string;
}

export function ChatPage({}: ChatPageProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  async function handleQuery() {
    if (!query.trim()) return;

    setIsLoading(true);
    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: query }]);

    try {
      const response = await postChatMessage(query, conversationId);
      console.log(response);

      // Save conversation ID if this is a new conversation
      if (conversationId === "") {
        setConversationId(response.conversation_id);
      }

      // Add assistant's response to messages
      setMessages((prev) => [
        ...prev,
        { role: response.role, content: response.content },
      ]);

      // Clear input
      setQuery("");
    } catch (error) {
      console.error("Error sending message:", error);
      // You might want to show an error message to the user
    } finally {
      setIsLoading(false);
    }
  }

  function handleStop() {
    // Implement stop functionality here
  }

  useEffect(() => {
    getUserConversations()
      .then((conversations) => {
        conversations.forEach((conversation) => {
          console.log(`Conversation ${conversation.conversation_id}:`);
          console.log(`- Messages: ${conversation.message_count}`);
          console.log(`- Created: ${conversation.created_at.toLocaleString()}`);
          console.log(`- Model: ${conversation.model}`);
        });
      })
      .catch((error) => {
        console.error("Failed to fetch conversations:", error);
      });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Display all messages */}
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserMessage key={index} message={message.content} />
        ) : (
          <AssistantMessage key={index} message={message.content} />
        ),
      )}

      {/* Input section */}
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
