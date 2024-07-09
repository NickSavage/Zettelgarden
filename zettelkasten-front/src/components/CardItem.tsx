import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PartialCard } from "../models/Card";

import { CardPreviewWindow } from "./CardPreviewWindow";

interface CardItemProps {
  card: PartialCard;
}

export function CardItem({ card }: CardItemProps) {
  const [showHover, setShowHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowHover(true);
  };

  return (
    <div key={card.id} className="card-item">
      <Link
        to={`/app/card/${card.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <span
          style={{ color: "blue", fontWeight: "bold" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowHover(false)}
        >
          - [{card.card_id}]
        </span>
        : {card.title}
      </Link>
      {showHover && card && (
        <CardPreviewWindow card={card} mousePosition={mousePosition} />
      )}
    </div>
  );
}
