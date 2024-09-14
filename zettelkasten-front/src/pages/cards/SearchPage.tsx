import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { fetchCards } from "../../api/cards";
import { fetchUserTags } from "../../api/tags";
import { Card } from "../../models/Card";
import { Tag } from "../../models/Tags";
import { sortCards } from "../../utils/cards";
import { Button } from "../../components/Button";
import { CardList } from "../../components/cards/CardList";
import { SearchTagMenu } from "../../components/cards/SearchTagMenu";
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

  const [tags, setTags] = useState<Tag[]>([]);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  function handleSearch(inputTerm = "") {
    let term = inputTerm == "" ? searchTerm : inputTerm;

    fetchCards(term).then((data) => {
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

  async function fetchTags() {
    fetchUserTags().then((data) => {
      if (data !== null) {
        console.log("tags");
        console.log(data);
        setTags(data);
      }
    });
  }

  function handleTagClick(tagName: string) {
    setSearchTerm("#" + tagName);
    handleSearch(tagName);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get("term");
    if (term) {
      setSearchTerm(term);
      handleSearch(term);
    }
    fetchTags();
    document.title = "Zettelgarden - Search";
    handleSearch();
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

          <div className="flex">
            <Button onClick={handleSearch} children={"Search"} />
            <select value={sortBy} onChange={handleSortChange}>
              <option value="sortNewOld">Newest</option>
              <option value="sortOldNew">Oldest</option>
              <option value="sortBigSmall">A to Z</option>
              <option value="sortSmallBig">Z to A</option>
            </select>
            <SearchTagMenu
              tags={tags.filter((tag) => tag.card_count > 0)}
              handleTagClick={handleTagClick}
            />
          </div>
        </div>
        {currentItems.length > 0 ? (
          <div>
            <CardList cards={currentItems} sort={false} showAddButton={false} />
            <div>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                children={"Previous"}
              />
              <span>
                {" "}
                Page {currentPage} of{" "}
                {Math.ceil(
                  (cards.length > 0 ? cards.length : partialCards.length) /
                    itemsPerPage,
                )}{" "}
              </span>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage ===
                  Math.ceil(
                    (cards.length > 0 ? cards.length : partialCards.length) /
                      itemsPerPage,
                  )
                }
                children={"Next"}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center w-full py-20">
            Search returned no results
          </div>
        )}
      </div>
    </div>
  );
}
