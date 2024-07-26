import React from "react";
import { PartialCard } from "../../models/Card";

interface CardTagProps {
  card: PartialCard;
  showTitle: boolean;
}

export function CardTag({ card, showTitle }: CardTagProps) {
  return (
    <div className="inline-block">
      <span style={{ color: "blue", fontWeight: "bold" }}>
        [{card.card_id}]
      </span>
      {showTitle && (
        <span>
          {" - "}
          {card.title}
        </span>
      )}
    </div>
  );
}
