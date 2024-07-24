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
          <CardTag card={card} showTitle={true} />
        </li>
      ))}
    </ul>
  );
}
