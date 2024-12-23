import React from "react";

import { CardListItem } from "./CardListItem";
import { PartialCard, CardChunk } from "../../models/Card";

interface CardListProps {
  cards: (PartialCard | CardChunk)[];
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
        <li key={backlink.id} className="flex items-center gap-2">
          <div className="flex-grow">
            <CardListItem card={backlink} showAddButton={showAddButton} />
          </div>
          {(backlink as CardChunk).combined_score !== undefined && (
            <div className="min-w-[80px] text-right">
              <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                {((backlink as CardChunk).combined_score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
