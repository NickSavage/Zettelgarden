import React, { useState } from "react";
import { PartialCard } from "../../models/Card";
import { CardTag } from "./CardTag";

interface BacklinkInputDropdownListProps {
  onSelect: (card: PartialCard) => void;
  onSearch: (searchTerm: string) => void;
  cards: PartialCard[];
  placeholder?: string;
  className?: string;
}

export function BacklinkInputDropdownList({
  onSelect,
  onSearch,
  cards,
  placeholder = "Search...",
  className = "",
}: BacklinkInputDropdownListProps) {
  const [inputValue, setInputValue] = useState<string>("");

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    onSearch(value);
  }

  function handleEnterPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && cards.length > 0) {
      handleSelect(cards[0]);
    }
  }

  function handleSelect(card: PartialCard) {
    setInputValue("");
    onSelect(card);
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="w-full">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleEnterPress}
            placeholder={placeholder}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
        {cards.length > 0 && (
          <div className="absolute w-full mt-1 z-50">
            <ul className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {cards.map((card) => (
                <li
                  key={card.card_id}
                  className="cursor-pointer hover:bg-blue-50 p-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                  onClick={() => handleSelect(card)}
                >
                  <CardTag card={card} showTitle={true} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
