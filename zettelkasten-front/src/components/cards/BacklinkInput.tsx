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
    <div className="flex relative inline">
      <div>
        <div>
          <input
            type="text"
            value={link}
            onChange={handleLinkInputChange}
            placeholder="Add Backlink"
            onKeyDown={handleEnterPress}
          />
        </div>
        {topResults.length > 0 && (
          <BacklinkInputDropdownList
            addBacklink={handleDropdownClick}
            cards={topResults}
          />
        )}
      </div>
    </div>
  );
}
