import React, { useEffect, useState } from "react";
import { usePartialCardContext } from "../../contexts/CardContext";
import { BacklinkInputDropdownList } from "./BacklinkInputDropdownList";
import { quickFilterCards } from "../../utils/cards";
import { PartialCard } from "../../models/Card";
import { useNavigate } from "react-router-dom";

interface QuickSearchWindowProps {
  setShowWindow: (showWindow: boolean) => void;
}

export function QuickSearchWindow({ setShowWindow }: QuickSearchWindowProps) {
  const { partialCards } = usePartialCardContext();
  const [link, setLink] = useState<string>("");
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();

  function handleSearch(card: PartialCard) {
    setShowWindow(false);
    navigate(`/app/card/${card.id}`);
  }

  function handleLinkInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLink(e.target.value);
    const search = e.target.value; // assuming you want case-insensitive matching
    console.log(search);
    setSearchTerm(search);
    if (search !== "") {
      let results = quickFilterCards(partialCards, search);
      console.log(results);
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
      handleSearch(enteredCard);
    }
  }

  function handleDropdownClick(enteredCard: PartialCard) {
    setLink("");
    setTopResults([]);
    setSearchTerm("");
    handleSearch(enteredCard);
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
        <input
          type="text"
          value={link}
          onChange={handleLinkInputChange}
          placeholder="ID"
          onKeyDown={handleEnterPress}
          style={{ display: "block", marginRight: "10px" }}
          autoFocus
        />

        {topResults.length > 0 && (
          <div className="absolute top-auto left-1/2 w-1/4 p-4 bg-white border border-gray-200 z-10 shadow">
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
