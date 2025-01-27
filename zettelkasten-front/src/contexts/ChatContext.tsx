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
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [conversationId, setConversationId] = useState<string>("");
  const [showChat, setShowChat] = useState<boolean>(false);
  return (
    <ChatContext.Provider value={{ conversationId, setConversationId, showChat, setShowChat }}>
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
