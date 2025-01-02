import React from "react";
import { CardListItem } from "./CardListItem";
import { CardChunkListItem } from "./CardChunkListItem";
import { PartialCard, CardChunk } from "../../models/Card";
import { CardIcon } from "../../assets/icons/CardIcon";

interface SearchResultListProps {
  results: (PartialCard | CardChunk)[];
  showAddButton?: boolean;
  showPreview?: boolean;
}

export function SearchResultList({ 
  results, 
  showAddButton = true,
  showPreview = true,
}: SearchResultListProps) {
  return (
    <ul>
      {results.map((result) => {
        const isChunk = 'combined_score' in result;
        return (
          <li key={result.id} className="mb-2">
            <div className="flex items-center gap-2">
              {!isChunk && (
                <div className="text-gray-400">
                  <CardIcon />
                </div>
              )}
              <div className="flex-grow">
                {isChunk ? (
                  showPreview ? (
                    <CardChunkListItem card={result as CardChunk} showAddButton={showAddButton} />
                  ) : (
                    <CardListItem card={result} showAddButton={showAddButton} />
                  )
                ) : (
                  <CardListItem card={result} showAddButton={showAddButton} />
                )}
              </div>
              {isChunk && (
                <div className="min-w-[80px] text-right">
                  <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                    {((result as CardChunk).combined_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
} 