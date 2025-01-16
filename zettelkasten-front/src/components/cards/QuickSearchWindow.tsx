import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartialCard } from "../../models/Card";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";
import { usePartialCardContext } from "../../contexts/CardContext";
import { quickFilterCards } from "../../utils/cards";

interface QuickSearchWindowProps {
  setShowWindow: (showWindow: boolean) => void;
}

export function QuickSearchWindow({ setShowWindow }: QuickSearchWindowProps) {
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const navigate = useNavigate();
  const { partialCards } = usePartialCardContext();

  function handleSelect(card: PartialCard) {
    setShowWindow(false);
    navigate(`/app/card/${card.id}`);
  }

  async function handleSearch(searchTerm: string) {
    if (searchTerm !== "") {
      let results = quickFilterCards(partialCards, searchTerm);
      setTopResults(
        results === null ? [] : results.filter((card) => !card.card_id.includes("/"))
      );
    } else {
      setTopResults([]);
    }
  }

  return (
    <div
      className="create-task-popup-overlay"
      onClick={() => setShowWindow(false)}
    >
      <div
        className="create-task-popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        <BacklinkInputDropdownList
          onSelect={handleSelect}
          onSearch={handleSearch}
          cards={topResults}
          placeholder="Search cards..."
        />
      </div>
    </div>
  );
}
