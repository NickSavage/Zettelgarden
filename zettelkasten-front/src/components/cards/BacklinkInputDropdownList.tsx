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
    <ul className="input-link-dropdown">
      {cards.map((card, index) => (
        <li
          key={card.card_id}
	  className="cursor-pointer bg-slate-200 hover:bg-slate-400 p-2"
          onClick={(e) => addBacklink(card)}
        >
          <CardTag card={card} showTitle={true} />
        </li>
      ))}
    </ul>
  );
}
