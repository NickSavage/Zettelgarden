import React from "react";

import { CardItem } from "./CardItem";
import { PartialCard } from "../../models/Card";

interface CardListProps {
  cards: PartialCard[];
  sort?: boolean;
}

export function CardList({ cards, sort = true }: CardListProps) {
  console.log("sort?", sort);
  const sortedCards = sort
    ? [...cards].sort((a, b) => a.card_id.localeCompare(b.card_id))
    : cards;

  return (
    <ul>
      {sortedCards.map((backlink, index) => (
        <li className="">
          <CardItem card={backlink} />
        </li>
      ))}
    </ul>
  );
}
