import React, { useState } from "react";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";
import { PartialCard } from "../../models/Card";
import { usePartialCardContext } from "../../contexts/CardContext";
import { quickFilterCards } from "../../utils/cards";

interface BacklinkInputProps {
  addBacklink: (selectedCard: PartialCard) => void;
}

export function BacklinkInput({ addBacklink }: BacklinkInputProps) {
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const { partialCards } = usePartialCardContext();

  function handleSearch(searchTerm: string) {
    if (searchTerm !== "") {
      let results = quickFilterCards(partialCards, searchTerm);
      setTopResults(results);
    } else {
      setTopResults([]);
    }
  }

  function handleSelect(card: PartialCard) {
    setTopResults([]);
    addBacklink(card);
  }

  return (
    <BacklinkInputDropdownList
      onSelect={handleSelect}
      onSearch={handleSearch}
      cards={topResults}
      placeholder="Add Backlink"
      className="max-w-md"
    />
  );
}
