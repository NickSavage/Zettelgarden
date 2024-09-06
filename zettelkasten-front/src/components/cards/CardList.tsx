import React from "react";

import { CardListItem } from "./CardListItem";
import { PartialCard } from "../../models/Card";

interface CardListProps {
  cards: PartialCard[];
  sort?: boolean;
  showAddButton?: boolean;
}

export function CardList({ cards, sort = true, showAddButton = true }: CardListProps) {
  console.log("sort?", sort);
  const sortedCards = sort
    ? [...cards].sort((a, b) => a.card_id.localeCompare(b.card_id))
    : cards;

  return (
    <ul>
      {sortedCards.map((backlink, index) => (
        <li className="">
        <CardListItem card={backlink} showAddButton={showAddButton} />
        </li>
      ))}
    </ul>
  );
}
