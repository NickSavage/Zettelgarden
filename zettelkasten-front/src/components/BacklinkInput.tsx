import React, {useState} from "react"

import { BacklinkInputDropdownList } from "../components/BacklinkInputDropdownList";

import {PartialCard, Card} from "../models/Card";

interface BacklinkInputProps {
    cards: PartialCard[];
    currentCard: Card;
    addBacklink: (selectedCard: PartialCard) => void
}

export function BacklinkInput({cards, currentCard, addBacklink}: BacklinkInputProps) {
  const [topResults, setTopResults] = useState<PartialCard[]>([]);
  const [link, setLink] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  function handleLinkInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLink(e.target.value);
    const search = e.target.value; // assuming you want case-insensitive matching
    setSearchTerm(search);
    if (search !== "") {
      const exactMatchCard = cards.find((card) => card.card_id === search);
      const matchingCards = cards.filter(
        (card) =>
          card.card_id.toLowerCase().startsWith(search.toLowerCase()) ||
          card.title.toLowerCase().includes(search.toLowerCase())
      );

      // If an exact match is found, make sure it is at the front of the array
      let filteredCards = exactMatchCard
        ? [exactMatchCard, ...matchingCards]
        : matchingCards;
      filteredCards = filteredCards.filter(
        (card, index, self) =>
          index === self.findIndex((t) => t.card_id === card.card_id)
      );
      let results = filteredCards.slice(0, 5);
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
        return
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
            }}
          >
            <label htmlFor="refInput" style={{ marginRight: "10px" }}>
              Add Backlink:
            </label>
            <input
              type="text"
              value={link}
              onChange={handleLinkInputChange}
              placeholder="ID"
              onKeyDown={handleEnterPress}
              style={{ display: "block", marginRight: "10px" }}
            />
            {topResults && (
              <BacklinkInputDropdownList
                addBacklink={handleDropdownClick}
                cards={topResults}
              />
            )}
          </div>
    )

}