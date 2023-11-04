import React, { useState } from "react";

export function SearchPage({ cards, handleViewCard }) {
  const [searchTerm, setSearchTerm] = useState("");
  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

  return (
    <div>
      <input
        style={{ display: "block", width: "100%", marginBottom: "10px" }} // Updated style here
        type="text"
        id="title"
        value={searchTerm}
        placeholder="Search"
        onChange={handleSearch}
      />
      <ul>
        {cards
          .filter(
            (card) =>
              card.title.toLowerCase().includes(searchTerm) ||
              card.body.toLowerCase().includes(searchTerm),
          )
          .map((card, index) => (
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
                : {card.title}
                <br />
                <br />
                <span>{card.body}</span>
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
}
