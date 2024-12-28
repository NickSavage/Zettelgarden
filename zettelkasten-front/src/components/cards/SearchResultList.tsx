import React from "react";

import { CardListItem } from "./CardListItem";
import { CardChunkListItem } from "./CardChunkListItem";
import { PartialCard, CardChunk } from "../../models/Card";

interface SearchResultListProps {
  cards: (PartialCard | CardChunk)[];
  sort?: boolean;
  showAddButton?: boolean;
  variant?: 'default' | 'chunk';
}

export function SearchResultList({ 
  cards, 
  sort = true, 
  showAddButton = true,
  variant = 'default'
}: SearchResultListProps) {
  const sortedCards = sort
    ? [...cards].sort((a, b) => a.card_id.localeCompare(b.card_id))
    : cards;

  return (
    <ul>
      {sortedCards.map((card) => (
        <li key={card.id} className={variant === 'chunk' ? '' : 'flex items-center gap-2'}>
          <div className={variant === 'chunk' ? '' : 'flex-grow'}>
            {variant === 'chunk' ? (
              <CardChunkListItem card={card as CardChunk} showAddButton={showAddButton} />
            ) : (
              <CardListItem card={card} showAddButton={showAddButton} />
            )}
          </div>
          {(card as CardChunk).combined_score !== undefined && (
            <div className="min-w-[80px] text-right">
              <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                {((card as CardChunk).combined_score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
} 