import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { fetchCards } from "../../api/cards";
import { Card } from "../../models/Card";
import { sortCards } from "../../utils";
import { Button } from "../../components/Button";
import { CardList } from "../../components/cards/CardList";
import { usePartialCardContext } from "../../contexts/CardContext";

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
  const [sortBy, setSortBy] = useState("sortNewOld");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { partialCards } = usePartialCardContext();

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function handleSearch() {
    fetchCards(searchTerm).then((data) => {
      if (data === null) {
	setCards([]);
      } else {
      setCards(data);
	
      }
    });
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value);
  }

  function getSortedAndPagedCards() {
    const sortedCards = sortCards(cards, sortBy);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedCards.slice(indexOfFirstItem, indexOfLastItem);
  }

  useEffect(() => {
    document.title = "Zettelgarden - Search";
    handleSearch()
  }, []);

  const currentItems = getSortedAndPagedCards();

  return (
    <div>
      <div>
        <div className="bg-slate-200 p-2 border-slate-400 border">
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

          <Button onClick={handleSearch} children={"Search"} />
          <select value={sortBy} onChange={handleSortChange}>
            <option value="sortNewOld">Newest</option>
            <option value="sortOldNew">Oldest</option>
            <option value="sortBigSmall">A to Z</option>
            <option value="sortSmallBig">Z to A</option>
          </select>
        </div>
        {currentItems.length > 0 ? (
          <div>
            <CardList cards={currentItems} sort={false} />
            <div>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                children={"Previous"}
              />
              <span>
                {" "}
                Page {currentPage} of{" "}
                {Math.ceil((cards.length > 0 ? cards.length : partialCards.length) / itemsPerPage)}{" "}
              </span>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === Math.ceil((cards.length > 0 ? cards.length : partialCards.length) / itemsPerPage)
                }
                children={"Next"}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center w-full py-20">Search returned no results</div>
        )}
      </div>
    </div>
  );
}
