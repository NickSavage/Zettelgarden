import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../../assets/icons/StopIcon";
import {
  postChatMessage,
  getUserConversations,
  getChatConversation,
} from "../../api/chat";
import { ChatCompletion, ConversationSummary } from "../../models/Chat";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";

import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import { Dialog } from '@headlessui/react' // You'll need to install @headlessui/react


interface ChatPageProps {}

interface Message {
  role: string;
  content: string;
}

export function ChatPage({}: ChatPageProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatCompletion[]>([]);
  const [searchParams] = useSearchParams();
  const { conversationId, setConversationId } = useChatContext();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  async function handleQuery() {
    if (!query.trim()) return;

    setIsLoading(true);

    // Create a temporary user message that matches ChatCompletion structure
    const tempUserMessage: ChatCompletion = {
      id: Date.now(), // temporary ID
      user_id: 0, // placeholder
      conversation_id: conversationId || "",
      sequence_number: messages.length,
      role: "user",
      content: query,
      refusal: null,
      model: "", // placeholder
      tokens: 0, // placeholder
      created_at: new Date(),
      updated_at: new Date(),
      cards: [],
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await postChatMessage(query, conversationId);
      console.log(response);

      // Save conversation ID if this is a new conversation
      if (conversationId === "") {
        setConversationId(response.conversation_id);
        navigate(`?id=${response.conversation_id}`);
      }

      // Add assistant's response to messages
      setMessages((prev) => [...prev, response]);

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
      setConversationId(id);
      // Maybe load existing conversation messages
      getChatConversation(id).then((messages) => {
        messages.forEach((message) => {
          setMessages((prev) => [...prev, message]);
        });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    getUserConversations()
      .then((conversations) => {
        setConversations(conversations);
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
              <AssistantMessage key={index} message={message} />
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
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setIsDialogOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v8H5V6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <input
            className={`w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
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
            disabled={isLoading} // Add this line
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
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Conversations
            </Dialog.Title>

            <div className="max-h-[60vh] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => {
                    navigate(`?id=${conversation.id}`);
                    setIsDialogOpen(false);
                  }}
                >
                  <h3 className="font-medium text-gray-900">
                    {conversation.title || "Untitled Conversation"}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500 gap-2">
                    <span>
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{conversation.message_count} messages</span>
                    <span>•</span>
                    <span>{conversation.model}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
