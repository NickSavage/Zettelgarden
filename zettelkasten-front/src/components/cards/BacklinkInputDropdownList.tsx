import React from "react";

import { Card, PartialCard } from "../../models/Card";

interface BacklinkInputDropdownListProps {
  addBacklink: (card: PartialCard) => void;
  cards: PartialCard[];
}

export function BacklinkInputDropdownList({
  addBacklink,
  cards,
}: BacklinkInputDropdownListProps) {
  return (
    <ul className="input-link-dropdown">
      {cards.map((card, index) => (
        <li
          key={card.card_id}
          style={{
            background: "lightgrey",
            cursor: "pointer",
          }}
          onClick={(e) => addBacklink(card)}
        >
          {card.card_id} - {card.title}
        </li>
      ))}
    </ul>
  );
}
