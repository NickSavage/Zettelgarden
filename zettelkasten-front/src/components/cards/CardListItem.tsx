import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PartialCard } from "../../models/Card";

import { CardPreviewWindow } from "./CardPreviewWindow";
import { CardLink } from "./CardLink";

import { formatDate } from "../../utils/dates"

interface CardListItemProps {
  card: PartialCard;
}

export function CardListItem({ card }: CardListItemProps) {
  const [showHover, setShowHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowHover(true);
  };

  return (
    <div key={card.id} className="card-item py-2 px-2.5 flex">
      <div className="flex-grow">
        <span
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowHover(false)}
        >
          <CardLink
            card={card}
            handleViewBacklink={(id: number) => {}}
            showTitle={true}
          />
        </span>
      </div>
      <div className="flex text-xs">{formatDate(card.created_at)}</div>

      {showHover && card && (
        <CardPreviewWindow cardPK={card.id} mousePosition={mousePosition} />
      )}
    </div>
  );
}
