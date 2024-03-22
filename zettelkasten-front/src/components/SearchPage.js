import React, { useState, useEffect } from "react";
import { fetchCards } from "../api";

import { useNavigate } from "react-router-dom";

export function SearchPage({ searchTerm, setSearchTerm, cards, setCards }) {
  const [sortBy, setSortBy] = useState("relevant");
  const navigate = useNavigate();

  function handleCardClick(card_id) {
    navigate(`/app/card/${card_id}`);
  }
  function handleSearchUpdate(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    console.log("this is happening for real");
    fetchCards(searchTerm).then((data) => {
      setCards(data);
    });
  }
  function handleSortChange(e) {
    setSortBy(e.target.value); // Update sort state when user selects a different option
  }

  function sortCards() {
    switch (sortBy) {
      case "newest":
        return [...cards].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
        );
      case "oldest":
        return [...cards].sort(
          (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
        );
      case "a-z":
        return [...cards].sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return [...cards].sort((a, b) => b.title.localeCompare(a.title));
      default:
        return cards; // Default case for relevance or other non-sorting options
    }
  }
  const sortedCards = sortCards(); // Call sortCards to get the sorted cards
  console.log(sortedCards);
  return (
    <div>
      <input
        style={{ display: "block", width: "100%", marginBottom: "10px" }} // Updated style here
        type="text"
        id="title"
        value={searchTerm}
        placeholder="Search"
        onChange={handleSearchUpdate}
        onKeyPress={(event) => {
          if (event.key === "Enter") {
            handleSearch();
          }
        }}
      />

      <button className="btn" onClick={handleSearch}>
        Search
      </button>
      <select value={sortBy} onChange={handleSortChange}>
        <option value="relevance">Relevance</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="a-z">A to Z</option>
        <option value="z-a">Z to A</option>
      </select>
      <ul>
        {sortedCards.map((card, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleCardClick(card.id);
              }}
              style={{ color: "black", textDecoration: "none" }}
            >
              <span style={{ color: "blue", fontWeight: "bold" }}>
                {card.card_id}
              </span>
              <span>: {card.title} - </span>
              <span>
                {card.body.length > 50
                  ? `${card.body.substring(0, 50)}...`
                  : card.body}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
