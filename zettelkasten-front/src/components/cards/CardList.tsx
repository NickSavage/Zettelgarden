import React from "react";
import { CardListItem } from "./CardListItem";
import { PartialCard } from "../../models/Card";

interface CardListProps {
  cards: PartialCard[];
  sort?: boolean;
  showAddButton?: boolean;
}

export function CardList({ 
  cards, 
  sort = true, 
  showAddButton = true,
}: CardListProps) {
  const sortedCards = sort
    ? [...cards].sort((a, b) => a.card_id.localeCompare(b.card_id))
    : cards;

  return (
    <ul>
      {sortedCards.map((card) => (
        <li key={card.id} className="flex items-center gap-2">
          <div className="flex-grow">
            <CardListItem card={card} showAddButton={showAddButton} />
          </div>
        </li>
      ))}
    </ul>
  );
} 