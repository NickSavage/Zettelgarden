import React from "react";

import { Card, PartialCard } from "../../models/Card";
import { CardLink } from "./CardLink";

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
          <CardLink
            card={card}
            handleViewBacklink={(id: number) => {}}
            showTitle={true}
          />
        </li>
      ))}
    </ul>
  );
}
