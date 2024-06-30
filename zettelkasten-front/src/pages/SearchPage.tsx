import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { fetchCards } from "../api/cards";
import { Card } from "../models/Card";
import { useNavigate } from "react-router-dom";
import { sortCards } from "../utils";

interface SearchPageProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  cards: Card[];
  setCards: (cards: Card[]) => void;
}

export function SearchPage({
  searchTerm,
  setSearchTerm,
  cards,
  setCards,
}: SearchPageProps) {
  const [sortBy, setSortBy] = useState("relevant");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    fetchCards(searchTerm).then((data) => {
      setCards(data);
    });
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value);
  }
  const sortedCards = sortCards(cards, "sortBigSmall");

  // Calculate the index of the last and first item on the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Slice the sortedCards array to only include the items for the current page
  const currentItems = sortedCards.slice(indexOfFirstItem, indexOfLastItem);

  // Change page handler
  useEffect(() => {
    document.title = "Zettelgarden - Search";
  }, []);

  return (
    <div>
      <input
        style={{ display: "block", width: "100%", marginBottom: "10px" }} // Updated style here
        type="text"
        id="title"
        value={searchTerm}
        placeholder="Search"
        onChange={handleSearchUpdate}
        onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
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
        {currentItems.map((card, index) => (
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
      <div>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          {" "}
          Page {currentPage} of {Math.ceil(sortedCards.length / itemsPerPage)}{" "}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(sortedCards.length / itemsPerPage)
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
