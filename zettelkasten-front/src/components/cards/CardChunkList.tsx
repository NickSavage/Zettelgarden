import React from "react";

import { CardChunkListItem } from "./CardChunkListItem";
import { CardChunk } from "../../models/Card";

interface CardChunkListProps {
  cards: CardChunk[];
  sort?: boolean;
  showAddButton?: boolean;
}

export function CardChunkList({
  cards,
  sort = true,
  showAddButton = true,
}: CardChunkListProps) {
  console.log("chunk", sort);
  const sortedCards = sort
    ? [...cards].sort((a, b) => a.card_id.localeCompare(b.card_id))
    : cards;

  return (
    <ul>
      {sortedCards.map((backlink, index) => (
        <li className="">
          <CardChunkListItem card={backlink} showAddButton={showAddButton} />
        </li>
      ))}
    </ul>
  );
}
