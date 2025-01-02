import React, { useState } from "react";

import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";

import { PartialCard, Card } from "../../models/Card";
import { usePartialCardContext } from "../../contexts/CardContext";
import { quickFilterCards } from "../../utils/cards";

interface BacklinkInputProps {
  addBacklink: (selectedCard: PartialCard) => void;
}

export function BacklinkInput({ addBacklink }: BacklinkInputProps) {
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const [link, setLink] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { partialCards } = usePartialCardContext();

  function handleLinkInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLink(e.target.value);
    const search = e.target.value; // assuming you want case-insensitive matching
    setSearchTerm(search);
    if (search !== "") {
      let results = quickFilterCards(partialCards, search);
      setTopResults(results);
    } else {
      setTopResults([]);
    }
  }

  function handleEnterPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setTopResults([]);
      let enteredCard = topResults.find((card) => card.card_id === searchTerm);
      if (enteredCard === undefined) {
        return;
      }
      setLink("");
      setTopResults([]);
      setSearchTerm("");
      addBacklink(enteredCard);
    }
  }

  function handleDropdownClick(enteredCard: PartialCard) {
    setLink("");
    setTopResults([]);
    setSearchTerm("");
    addBacklink(enteredCard);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="w-full">
        <div className="relative">
          <input
            type="text"
            value={link}
            onChange={handleLinkInputChange}
            placeholder="Add Backlink"
            onKeyDown={handleEnterPress}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>
        {topResults.length > 0 && (
          <div className="absolute w-full mt-1 z-50">
            <BacklinkInputDropdownList
              addBacklink={handleDropdownClick}
              cards={topResults}
            />
          </div>
        )}
      </div>
    </div>
  );
}
