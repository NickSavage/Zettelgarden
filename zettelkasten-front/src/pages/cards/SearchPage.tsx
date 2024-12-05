import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { fetchCards, semanticSearchCards } from "../../api/cards";
import { fetchUserTags } from "../../api/tags";
import { CardChunk, Card, PartialCard } from "../../models/Card";
import { Tag } from "../../models/Tags";
import { sortCards } from "../../utils/cards";
import { Button } from "../../components/Button";
import { CardList } from "../../components/cards/CardList";
import { CardChunkList } from "../../components/cards/CardChunkList";
import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { usePartialCardContext } from "../../contexts/CardContext";

interface SearchPageProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  cards: PartialCard[];
  setCards: (cards: PartialCard[]) => void;
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
  const [useClassicSearch, setUseClassicSearch] = useState<boolean>(false);
  const [onlyParentCards, setOnlyParentCards] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chunks, setChunks] = useState<CardChunk[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  async function handleSearch(inputTerm = "") {
    console.log("handling search");
    setIsLoading(true);
    setError(null);
    let term = inputTerm === "" ? searchTerm : inputTerm;
    try {
      if (useClassicSearch) {
        setError(null);
        const data = await fetchCards(term);
        if (data === null) {
          setCards([]);
        } else {
          let cards = data;
          if (onlyParentCards) {
            cards = cards.filter((card) => !card.card_id.includes("/"));
          }
          setCards(cards);
        }
      } else {
        if (term === "") {
          setIsLoading(false);
          return;
        }
        const data = await semanticSearchCards(term);
        if (data === null) {
          setChunks([]);
        } else {
          setChunks(data);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error);
    } finally {
      setIsLoading(false);
      console.log("loaded");
    }
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
        setTags(data);
      }
    });
  }

  function handleTagClick(tagName: string) {
    setSearchTerm("#" + tagName);
    handleSearch(tagName);
  }

  useEffect(() => {
    document.title = "Zettelgarden - Search";

    const params = new URLSearchParams(location.search);
    const recent = params.get("recent");
    if (recent !== "") {
      setUseClassicSearch(true);
    }

    const term = params.get("term");
    if (term) {
      setSearchTerm(term);
      handleSearch(term);
    } else {
      fetchTags();
      handleSearch();
    }
  }, []);

  const currentItems = getSortedAndPagedCards();

  const handleCheckboxChange = (event) => {
    setUseClassicSearch(event.target.checked);
  };
  const handleOnlyParentCardsChange = (event) => {
    setOnlyParentCards(event.target.checked);
  };

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
            <Button onClick={() => handleSearch()} children={"Search"} />
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
            <label>
              <input
                type="checkbox"
                checked={useClassicSearch}
                onChange={handleCheckboxChange}
              />
              Use Classic Search
            </label>
            <label>
              <input
                type="checkbox"
                checked={onlyParentCards}
                onChange={handleOnlyParentCardsChange}
              />
              Only Parent Cards
            </label>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center w-full py-20">Loading</div>
        ) : (
          <div>
            {currentItems.length > 0 || chunks.length > 0 ? (
              <div>
                {useClassicSearch ? (
                  <CardList
                    cards={currentItems}
                    sort={false}
                    showAddButton={false}
                  />
                ) : (
                  <CardChunkList
                    cards={chunks}
                    sort={false}
                    showAddButton={false}
                  />
                )}
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
                        (cards.length > 0
                          ? cards.length
                          : partialCards.length) / itemsPerPage,
                      )
                    }
                    children={"Next"}
                  />
                </div>
              </div>
            ) : (
              <div>
                {error === null ? (
                  <div className="flex justify-center w-full py-20">
                    Search returned no results
                  </div>
                ) : (
                  <div className="flex justify-center w-full py-20">
                    Search returned an error: {error.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
