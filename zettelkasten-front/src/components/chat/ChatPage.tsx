import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../../assets/icons/StopIcon";
import {
  postChatMessage,
  getUserConversations,
  getChatConversation,
} from "../../api/chat";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "../../contexts/ChatContext";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchParams] = useSearchParams();
  const {conversationId, setConversationId} = useChatContext();

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
    let id = searchParams.get("id");
    setMessages([]);
    if (id) {
      setConversationId(id)
      // Maybe load existing conversation messages
      getChatConversation(id).then((messages) => {
        messages.forEach((message) => {
          setMessages((prev) => [
            ...prev,
            { role: message.role, content: message.content },
          ]);
        });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    getUserConversations()
      .then((conversations) => {
        conversations.forEach((conversation) => {
          console.log(conversation);
        });
      })
      .catch((error) => {
        console.error("Failed to fetch conversations:", error);
      });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) =>
            message.role === "user" ? (
              <UserMessage key={index} message={message.content} />
            ) : (
              <AssistantMessage key={index} message={message.content} />
            ),
          )}
        </div>
      </div>
      <div className="sticky bottom-2">
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
    </div>
  );
}
