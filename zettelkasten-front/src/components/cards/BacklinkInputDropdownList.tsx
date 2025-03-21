import React, { useState } from "react";
import { Combobox } from "@headlessui/react";
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

  function handleInputChange(value: string) {
    setInputValue(value);
    onSearch(value);
  }

  function handleSelect(card: PartialCard) {
    setInputValue("");
    onSelect(card);
  }

  return (
    <div className={`relative w-full ${className}`}>
      <Combobox<PartialCard | null> value={null} onChange={handleSelect}>
        <div className="w-full">
          <div className="relative">
            <Combobox.Input
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder={placeholder}
              displayValue={() => inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
            />
          </div>
          {(cards.length > 0 || inputValue.length > 0) && (
            <Combobox.Options className="absolute w-full mt-1 z-50 overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {cards.length > 0 ? (
                cards.map((card) => (
                  <Combobox.Option
                    key={card.card_id}
                    value={card}
                    className={({ active }) =>
                      `cursor-pointer p-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                        active ? "bg-blue-50" : ""
                      }`
                    }
                  >
                    <CardTag card={card} showTitle={true} />
                  </Combobox.Option>
                ))
              ) : (
                inputValue.length > 0 && (
                  <div className="p-3 text-gray-500">No results found</div>
                )
              )}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
}
