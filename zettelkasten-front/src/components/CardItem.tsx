import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PartialCard } from "../models/Card";

import { CardPreviewWindow } from "./CardPreviewWindow";

interface CardItemProps {
  card: PartialCard;
}

export function CardItem({ card }: CardItemProps) {
  const [showHover, setShowHover] = useState(false);
  return (
    <div key={card.id}
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <Link
        to={`/app/card/${card.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <span style={{ color: "blue", fontWeight: "bold" }}>
          - {card.card_id}
        </span>
        : {card.title}
      </Link>
      {showHover && card && <CardPreviewWindow card={card} />}
    </div>
  );
}
