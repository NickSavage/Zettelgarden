import React, { useState } from "react";
import Markdown from "react-markdown";
import { ChatCompletion } from "../../models/Chat";
import { CardItem } from "../../components/cards/CardItem";
import { saveExistingCard, getCard } from "../../api/cards";
import { Card } from "../../models/Card";
import { useCardRefresh } from "../../contexts/CardRefreshContext";
import { useLocation } from "react-router-dom";

interface AssistantMessageProps {
  message: ChatCompletion;
  isStreaming?: boolean;
}

interface CardUpdate {
  id?: number;
  title?: string;
  body?: string;
}

const CardBlock = ({ children }: { children: string }) => {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updatedContent, setUpdatedContent] = useState<string | null>(null);
  const { refreshCard } = useCardRefresh();
  const location = useLocation();

  try {
    const cleanContent = children.replace(/`*$/, '').trim();
    const jsonContent: CardUpdate = JSON.parse(cleanContent);
    
    // Validate the content has required fields
    const isValid = (jsonContent.title || jsonContent.body);

    const handleApply = async () => {
      if (!jsonContent.id) {
        setError("Card ID is required");
        return;
      }

      // Check if we're currently viewing this card
      const currentPath = location.pathname;
      const expectedPath = `/app/card/${jsonContent.id}`;
      if (!currentPath.startsWith(expectedPath)) {
        setError("Warning: This card is not currently being viewed. Please navigate to the card's view page before applying updates.");
        return;
      }

      setIsApplying(true);
      setError(null);
      setSuccess(false);
      setUpdatedContent(null);

      try {
        // First fetch the existing card
        const existingCard = await getCard(String(jsonContent.id));
        
        // Only update the fields that were provided in jsonContent
        const cardUpdate: Card = {
          ...existingCard,
          title: jsonContent.title ?? existingCard.title,
          body: jsonContent.body ?? existingCard.body,
        };

        await saveExistingCard(cardUpdate);
        
        // Fetch the updated card
        const updatedCard = await getCard(String(jsonContent.id));
        setUpdatedContent(JSON.stringify({
          id: updatedCard.id,
          title: updatedCard.title,
          body: updatedCard.body
        }, null, 2));
        setSuccess(true);

        // Trigger refresh in ViewPage if it's open
        refreshCard(String(jsonContent.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to apply card update");
      } finally {
        setIsApplying(false);
      }
    };

    return (
      <div className="space-y-2">
        {isValid && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={`px-3 py-1 text-sm rounded ${
                isApplying 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isApplying ? "Applying..." : "Apply Changes"}
            </button>
            {error && <span className="text-red-500 text-sm">{error}</span>}
            {success && <span className="text-green-500 text-sm">Changes applied successfully!</span>}
          </div>
        )}
        <pre className={`p-2 rounded whitespace-pre-wrap break-words ${
          success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
        }`}>
          {updatedContent || JSON.stringify(jsonContent, null, 2)}
        </pre>
      </div>
    );
  } catch (e) {
    return <pre className="text-red-500 p-2 rounded bg-red-50 whitespace-pre-wrap break-words">{children}</pre>;
  }
};

export function AssistantMessage({
  message,
  isStreaming,
}: AssistantMessageProps) {
  return (
    <div className={`text-sm ${isStreaming ? "animate-pulse" : ""}`}>
      <Markdown
        components={{
          code: ({ className, children, ...props }) => {
            // Check if this is a card block
            const isCard = (className || '').includes('card');
            if (isCard) {
              return <CardBlock>{String(children)}</CardBlock>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {message.content}
      </Markdown>
      <div>
        <ul>
          {message.cards &&
            message.cards.map((card, index) => (
              <li key={index}>
                <CardItem card={card} />
              </li>
            ))}
        </ul>
      </div>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-blink">
          |
        </span>
      )}
    </div>
  );
}
