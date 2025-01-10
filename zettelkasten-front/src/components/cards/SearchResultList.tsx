import React from "react";
import { SearchResult } from "../../models/Card";
import { CardIcon } from "../../assets/icons/CardIcon";
import { PersonIcon } from "../../assets/icons/PersonIcon";
import { Link } from "react-router-dom";
import { formatDate } from "../../utils/dates";

interface SearchResultItemProps {
  result: SearchResult;
  showPreview: boolean;
  onEntityClick?: (entityName: string) => void;
}

function SearchResultItem({ result, showPreview, onEntityClick }: SearchResultItemProps) {
  const isClassicSearch = result.type === "card" && result.score === 1.0;
  const isEntity = result.type === "entity";
  const isCard = result.type === "card";
  const cardId = Number(result.metadata?.id) || 0;

  const handleClick = (e: React.MouseEvent) => {
    if (isEntity && onEntityClick) {
      e.preventDefault();
      onEntityClick(`@[${result.title}]`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isCard && (
        <div className="text-gray-400">
          <CardIcon />
        </div>
      )}
      {isEntity && (
        <div className="text-gray-400">
          <PersonIcon />
        </div>
      )}
      <div className="flex-grow">
        <div className="flex flex-col">
          <div>
            <Link 
              to={isEntity ? "#" : `/app/card/${cardId}`}
              onClick={handleClick}
              className="hover:underline"
            >
              {!isEntity && (
                <>
                  <span className="text-blue-600 hover:text-blue-800">[{result.id}]</span>
                  <span className="mx-2 text-gray-400">-</span>
                </>
              )}
              <span>{result.title}</span>
            </Link>
          </div>
          {showPreview && result.preview && (
            <div className="mt-0.5 pl-2 text-sm italic text-gray-600">
              {result.preview}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end text-xs text-gray-500">
        <div>{formatDate(result.created_at.toISOString())}</div>
        {!isClassicSearch && (
          <div className="mt-1">
            <span className="bg-gray-100 rounded px-2 py-0.5">
              {(result.score * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchResultListProps {
  results: SearchResult[];
  showPreview?: boolean;
  onEntityClick?: (entityName: string) => void;
}

export function SearchResultList({ 
  results, 
  showPreview = true,
  onEntityClick,
}: SearchResultListProps) {
  return (
    <ul className="space-y-1">
      {results.map((result) => (
        <li key={result.id} className="py-1 px-2 hover:bg-gray-50 rounded-lg">
          <SearchResultItem 
            result={result} 
            showPreview={showPreview} 
            onEntityClick={onEntityClick}
          />
        </li>
      ))}
    </ul>
  );
} 