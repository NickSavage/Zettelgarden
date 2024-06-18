import React from "react";

import { Card } from "../models/Card" 

interface BacklinkInputDropdownListProps {
  addBacklink: (card: Card) => void;
  cards: Card[];
}

export function BacklinkInputDropdownList({ addBacklink, cards }: BacklinkInputDropdownListProps) {
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
