import React, { useState, useEffect } from "react";
import { fetchCards } from "../api";

export function SearchPage({ handleViewCard }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cards, setCards] = useState([]);
  function handleSearchUpdate(e) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    console.log("this is happening for real");
    fetchCards(searchTerm).then((data) => {
      console.log(data);
      setCards(data);
    });
  }

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
      <ul>
        {cards.map((card, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleViewCard(card);
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
