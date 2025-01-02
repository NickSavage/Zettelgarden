import React from "react";

import { PartialCard } from "../../models/Card";
import { CardTag } from "./CardTag";

interface BacklinkInputDropdownListProps {
  addBacklink: (card: PartialCard) => void;
  cards: PartialCard[];
}

export function BacklinkInputDropdownList({
  addBacklink,
  cards,
}: BacklinkInputDropdownListProps) {
  console.log("backlinks", cards);
  return (
    <ul className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
      {cards.map((card, index) => (
        <li
          key={card.card_id}
          className="cursor-pointer hover:bg-blue-50 p-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
          onClick={(e) => addBacklink(card)}
        >
          <CardTag card={card} showTitle={true} />
        </li>
      ))}
    </ul>
  );
}
