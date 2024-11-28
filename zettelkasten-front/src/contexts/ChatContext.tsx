import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";

interface ChatContextType {
  conversationId: string;
  setConversationId: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [conversationId, setConversationId] = useState<string>("");

  return (
    <ChatContext.Provider value={{ conversationId, setConversationId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within an ChatProvider");
  }
  return context;
};
