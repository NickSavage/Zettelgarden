import React from "react";
import { PartialCard } from "../../models/Card";

interface CardTagProps {
  card: PartialCard;
  showTitle: boolean;
}

export function CardTag({ card, showTitle }: CardTagProps) {
  return (
    <div className="inline-block">

      <span className="text-blue-600 hover:text-blue-800">
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
