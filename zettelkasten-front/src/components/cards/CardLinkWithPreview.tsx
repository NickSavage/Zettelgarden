import React, { useState } from "react";

import { Card } from "../../models/Card";
import { CardPreviewWindow } from "./CardPreviewWindow";

interface CardLinkWithPreviewProps {
  currentCard: Card;
  card_id: string;
  handleViewBacklink: (card_id: number) => void;
}

export function CardLinkWithPreview({
  currentCard,
  card_id,
  handleViewBacklink,
}: CardLinkWithPreviewProps) {
  const [showHover, setShowHover] = useState(false);
  const linkedCard = currentCard.references
    .filter((x) => x !== null)
    .find((linked) => linked.card_id === card_id);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowHover(true);
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowHover(false)}
    >
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleViewBacklink(linkedCard!.id);
        }}
        style={{ fontWeight: "bold", color: "blue" }}
      >
        [{card_id}]
      </a>
      {showHover && linkedCard && (
        <CardPreviewWindow
          cardPK={linkedCard.id}
          mousePosition={mousePosition}
        />
      )}
    </span>
  );
}
