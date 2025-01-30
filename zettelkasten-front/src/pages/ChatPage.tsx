import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { StopIcon } from "../assets/icons/StopIcon";
import {
  postChatMessage,
  getUserConversations,
  getChatConversation,
} from "../api/chat";
import { ChatCompletion, ConversationSummary, UserLLMConfiguration } from "../models/Chat";
import { getUserLLMConfigurations } from "../api/chat";
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
import { Dialog } from "@headlessui/react";
import { BacklinkInput } from "../components/cards/BacklinkInput";

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
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const { lastCard } = usePartialCardContext();
  const [contextCards, setContextCards] = useState<PartialCard[]>([]);

  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);

  const [llmConfigurations, setLLMConfigurations] = useState<UserLLMConfiguration[]>([]);
  const [selectedConfiguration, setSelectedConfiguration] = useState<UserLLMConfiguration | null>(null);

  function handleSearchUpdate(e: ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value);
  }

  async function handleQuery() {
    if (!query.trim()) return;
    if (!selectedConfiguration) {
      // Show an error message or prompt to select a configuration
      alert("Please select a model configuration before sending a message");
      return;
    }

    setIsLoading(true);

    const tempUserMessage: ChatCompletion = {
      id: Date.now(), // temporary ID
      user_id: 0, // placeholder
      conversation_id: conversationId || "",
      sequence_number: messages.length,
      role: "user",
      content: query,
      refusal: null,
      model: selectedConfiguration.model?.model_identifier || "",
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
      const response = await postChatMessage(query, conversationId, contextCards, selectedConfiguration.id);
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
          setSelectedConversation(conversations.find(conversation => conversation.id === searchParams.get("id")) || null);

      })
      .catch((error) => {
        console.error("Failed to fetch conversations:", error);
      });
  }, []);

  useEffect(() => {
    // Load LLM configurations
    getUserLLMConfigurations()
      .then((configs) => {
        setLLMConfigurations(configs);
        // Set default configuration if available
        const defaultConfig = configs.find(config => config.is_default);
        if (defaultConfig) {
          setSelectedConfiguration(defaultConfig);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch LLM configurations:", error);
      });
  }, []);

  function handleRemoveContextCard(cardId: number) {
    console.log("removing context card", cardId);
    setContextCards(prev => prev.filter(card => card.id !== cardId));
    console.log("context cards", contextCards);
  }

  return (
    <div className="flex flex-col h-screen w-64 min-w-[32rem] max-w-[32rem] border-l">
      <div className="border-b bg-white p-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{selectedConversation?.title}</span>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setIsContextDialogOpen(true)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Add Context"
              >
                <PlusCircleIcon />
              </button>
              <span>Context:</span>
              
              <select
                className="ml-2 text-sm border rounded-md px-2 py-1"
                value={selectedConfiguration?.id || ""}
                onChange={(e) => {
                  const config = llmConfigurations.find(
                    (c) => c.id === parseInt(e.target.value)
                  );
                  setSelectedConfiguration(config || null);
                }}
              >
                <option value="">Select Model</option>
                {llmConfigurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.model?.provider?.name} - {config.model?.name || "Unknown Model"}
                  </option>
                ))}
              </select>
              
              {selectedConfiguration && (
                <span className="text-gray-600 text-xs">
                  ({selectedConfiguration.model?.provider?.name})
                </span>
              )}
            </div>
            {contextCards.map((card, index) => (
              <div key={index} className="px-4 flex items-center gap-2">
                <CardTag card={card} showTitle={true} />
                <button
                  onClick={() => handleRemoveContextCard(card.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Remove from context"
                >
                  <span className="text-sm">×</span>
                </button>
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
          setSelectedConversation(conversations.find(conversation => conversation.id === id) || null);
          navigate(`?id=${id}`);
        }}
      />
      <Dialog
        open={isContextDialogOpen}
        onClose={() => setIsContextDialogOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto z-50"
      >
        <div 
          className="fixed inset-0 bg-black/30" 
          aria-hidden="true"
          onClick={() => setIsContextDialogOpen(false)}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Add Context</h3>
            <BacklinkInput 
              addBacklink={(selectedCard) => {
                setContextCards(prev => {
                  if (!prev.some(card => card.id === selectedCard.id)) {
                    return [...prev, selectedCard];
                  }
                  return prev;
                });
                setIsContextDialogOpen(false);
              }} 
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
