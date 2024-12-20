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
  const [sortBy, setSortBy] = useState("sortCreatedNewOld");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { partialCards } = usePartialCardContext();
  const [useClassicSearch, setUseClassicSearch] = useState<boolean>(true);
  const [onlyParentCards, setOnlyParentCards] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chunks, setChunks] = useState<CardChunk[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }
  async function handleSearch(classicSearch, inputTerm) {
    console.log("handling search");
    setIsLoading(true);
    setError(null);

    // Use inputTerm directly instead of comparing with searchTerm
    const term = inputTerm || "";

    console.log("searching for term:", term);

    try {
      if (classicSearch) {
        setError(null);
        const data = await fetchCards(term);
        console.log("cards", data);
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
    }
  }

  useEffect(() => {
    const initializeSearch = async () => {
      document.title = "Zettelgarden - Search";
      const params = new URLSearchParams(location.search);
      const recent = params.get("recent");
      const term = params.get("term") || "";

      let classicSearch = useClassicSearch;

      if (recent !== null) {
        classicSearch = true;
        setUseClassicSearch(true);
        setSearchTerm("");
        await handleSearch(true, "");
      } else if (term) {
        classicSearch = true;
        setUseClassicSearch(true);
        setSearchTerm(term);
        await handleSearch(true, term);
      } else {
        await fetchTags();
        await handleSearch(classicSearch, "");
      }
    };

    initializeSearch();
  }, []);

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
    handleSearch(useClassicSearch, tagName);
  }

  useEffect(() => {
    document.title = "Zettelgarden - Search";

    let classicSearch = useClassicSearch;
    const params = new URLSearchParams(location.search);
    const recent = params.get("recent");
    let term = params.get("term");
    if (term === null) {
      term = "";
    }
    console.log("recent", recent, "term", term);

    if (recent !== null) {
      classicSearch = true;
      setUseClassicSearch(true);
      term = "";
    } else if (term !== "") {
      classicSearch = true;
      setUseClassicSearch(true);
      setSearchTerm(term);
    } else {
      fetchTags();
    }
    console.log(classicSearch, term);
    handleSearch(classicSearch, term);
  }, []);

  const currentItems = getSortedAndPagedCards();

  const handleCheckboxChange = (event) => {
    setUseClassicSearch(event.target.checked);
  };
  const handleOnlyParentCardsChange = (event) => {
    setOnlyParentCards(event.target.checked);
  };
  useEffect(() => {
    const initializeSearch = async () => {
      document.title = "Zettelgarden - Search";
      const params = new URLSearchParams(location.search);
      const recent = params.get("recent");
      const term = params.get("term") || "";

      let classicSearch = useClassicSearch;

      if (recent !== null) {
        classicSearch = true;
        setUseClassicSearch(true);
        setSearchTerm("");
        await handleSearch(true, "");
      } else if (term) {
        classicSearch = true;
        setUseClassicSearch(true);
        setSearchTerm(term);
        await handleSearch(true, term);
      } else {
        await fetchTags();
        await handleSearch(classicSearch, "");
      }
    };

    initializeSearch();
  }, []);

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
                handleSearch(useClassicSearch, searchTerm);
              }
            }}
          />

          <div className="flex">
            <Button
              onClick={() => handleSearch(useClassicSearch, searchTerm)}
              children={"Search"}
            />
            <select value={sortBy} onChange={handleSortChange}>
              <option value="sortCreatedNewOld">Creation Date (Newest)</option>
              <option value="sortCreatedOldNew">Creation Date (Oldest)</option>
              <option value="sortNewOld">Last Updated (Newest)</option>
              <option value="sortOldNew">Last Updated (Oldest)</option>
              <option value="sortBigSmall">A to Z</option>
              <option value="sortSmallBig">Z to A</option>
            </select>
            <SearchTagMenu
              tags={tags.filter((tag) => tag.card_count > 0)}
              handleTagClick={handleTagClick}
            />
            <div className="flex flex-col">
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
