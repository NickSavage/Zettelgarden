import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../assets/icons/StopIcon";
import {
  postChatMessage,
  getUserConversations,
  getChatConversation,
} from "../api/chat";
import { ChatCompletion, ConversationSummary } from "../models/Chat";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "../contexts/ChatContext";
import { useNavigate } from "react-router-dom";

import { AssistantMessage } from "../components/chat/AssistantMessage";
import { UserMessage } from "../components/chat/UserMessage";
import { ConversationDialog } from "../components/chat/ConversationDialog";
import { CardTag } from "../components/cards/CardTag";
import { usePartialCardContext } from "../contexts/CardContext";
import { PartialCard } from "src/models/Card";
import { PlusCircleIcon } from "../assets/icons/PlusCircleIcon";
import { HistoryIcon } from "../assets/icons/HistoryIcon";

interface ChatPageProps { }

interface Message {
  role: string;
  content: string;
}

export function ChatPage({ }: ChatPageProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatCompletion[]>([]);
  const [searchParams] = useSearchParams();
  const { conversationId, setConversationId } = useChatContext();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { lastCard } = usePartialCardContext();
  const [contextCards, setContextCards] = useState<PartialCard[]>([]);

  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function handleSearchUpdate(e: ChangeEvent<HTMLTextAreaElement>) {
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
      referenced_card_pk: contextCards.map((card) => card.id),
      user_query: query,
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await postChatMessage(query, conversationId, contextCards);
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
      console.log("loading conversation", id);
      getChatConversation(id).then((messages) => {
        console.log("messages", messages);
        messages.forEach((message) => {
          setMessages((prev) => [...prev, message]);
        });
      });
    }
    if (lastCard && contextCards.length === 0) {
      setContextCards((prev) => {
        if (!prev.some((card) => card.id === lastCard.id)) {
          return [...prev, lastCard];
        }
        return prev;
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
    <div className="flex flex-col h-screen w-64 min-w-[24rem] max-w-[24rem] border-l">
      <div className="border-b bg-white p-2">
        <div className="flex items-center gap-2 justify-end">
          <button
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
            title="New Chat"
            onClick={() => {
              navigate(`?id=${conversationId}`);
            }}
          >
            <PlusCircleIcon />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Chat History"
            onClick={() => setIsDialogOpen(true)}
          >
            <HistoryIcon />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          {messages.map((message, index) =>
            message.role === "user" ? (
              <UserMessage key={index} message={message.user_query} />
            ) : (
              <AssistantMessage key={index} message={message} />
            ),
          )}
        </div>
      </div>
      <div className="border-t bg-white p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
            <textarea
              className={`w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 resize-none min-h-[24px] max-h-[200px] ${isLoading ? "cursor-not-allowed opacity-50" : ""
                }`}
              id="title"
              value={query}
              rows={1}
              placeholder="How can I help you today?"
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                handleSearchUpdate(e);
                // Automatically adjust height
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key === "Enter") {
                  // If shift key is not pressed, submit
                  if (!event.shiftKey) {
                    event.preventDefault();
                    handleQuery();
                    // Reset height after submission
                    event.currentTarget.style.height = "24px"; // or whatever your initial height is
                  }
                }
              }}
              disabled={isLoading}
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
          <div>
            <span>Context:</span>
            {contextCards.map((card, index) => (
              <div key={index} className="px-4">
                <CardTag card={card} showTitle={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConversationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        conversations={conversations}
        onSelectConversation={(id) => {
          navigate(`?id=${id}`);
        }}
      />
    </div>
  );
}
