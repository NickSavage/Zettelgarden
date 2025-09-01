import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Menu } from '@headlessui/react';
import { semanticSearchCards } from "../../api/cards";
import { fetchUserTags } from "../../api/tags";
import { SearchResult } from "../../models/Card";
import { Tag } from "../../models/Tags";
import { SearchConfig } from "../../models/PinnedSearch";
import { sortCards } from "../../utils/cards";
import { Button } from "../../components/Button";
import { SearchResultList } from "../../components/cards/SearchResultList";
import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { PinSearchDialog } from "../../components/search/PinSearchDialog";
import { getPinnedSearches } from "../../api/pinnedSearches";
import { useTagContext } from "../../contexts/TagContext";
import { Entity } from "../../models/Card";
import { fetchEntityByName } from "../../api/entities";
import { setDocumentTitle } from "../../utils/title";

import { useShortcutContext } from "../../contexts/ShortcutContext";

interface SearchPageProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  searchConfig: SearchConfig
  setSearchConfig: (config: any) => void;
}

export function SearchPage({
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  searchConfig,
  setSearchConfig,
}: SearchPageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { tags } = useTagContext();
  const [showPinSearchDialog, setShowPinSearchDialog] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const latestRequestId = React.useRef(0);
  const {
    showEntityDialog,
    setShowEntityDialog,
    selectedEntity,
    setSelectedEntity,
  } = useShortcutContext();

  const params = new URLSearchParams(location.search);
  const pinnedId = params.get("pinned");

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  async function handleSearch(searchTerm: string, config: SearchConfig) {
    const requestId = ++latestRequestId.current;

    setIsLoading(true);
    setError(null);

    const term = searchTerm || "";
    console.log("searching for term:", term);

    try {
      const results = await semanticSearchCards(
        term,
        config.useFullText,
        config.showEntities,
        config.showFacts,
        config.sortBy,
        config.searchType,
        config.rerank,
      );
      if (requestId === latestRequestId.current) {
        setSearchResults(results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      if (requestId === latestRequestId.current) {
        setError(error);
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const initializeSearch = async () => {
      setDocumentTitle("Search")
      const params = new URLSearchParams(location.search);
      const recent = params.get("recent");
      const term = params.get("term") || "";
      const pinnedId = params.get("pinned");

      // Check if we're loading a pinned search
      if (pinnedId) {
        try {
          const pinnedSearches = await getPinnedSearches();
          const pinnedSearch = pinnedSearches.find(search => search.id === parseInt(pinnedId));

          console.log("search", pinnedSearch)
          if (pinnedSearch) {
            // Apply the pinned search configuration
            setSearchTerm(pinnedSearch.searchTerm);
            setSearchConfig({
              ...searchConfig,
              ...pinnedSearch.searchConfig
            });

            // Execute the search with the pinned configuration
            await handleSearch(pinnedSearch.searchTerm, pinnedSearch.searchConfig);
            return; // Exit early since we've handled the search
          }
        } catch (error) {
          console.error("Error loading pinned search:", error);
          setMessage("Error loading pinned search");
        }
      }

      // Regular search initialization if not a pinned search
      if (recent !== null) {
        let config = { ...searchConfig, useClassicSearch: true }
        setSearchConfig(config);
        setSearchTerm("");
        await handleSearch("", config);
      } else if (term) {
        let config = { ...searchConfig, useClassicSearch: true }
        setSearchConfig(config);
        setSearchTerm(term);
        await handleSearch(term, config);
      } else {
        let config = { ...searchConfig, sortBy: "sortByRanking" }
        setSearchConfig(config);
        await handleSearch("", config);
      }
    };

    initializeSearch();
  }, [location.search]); // Re-run when the URL search parameters change

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchConfig({ ...searchConfig, sortBy: e.target.value });
  }

  function handleTagClick(tagName: string) {
    setSearchTerm("#" + tagName);
    handleSearch(tagName, searchConfig);
  }

  async function handleEntityClick(entityName: string) {
    // Extract entity name from @[EntityName] format
    const cleanEntityName = entityName.replace('@[', '').replace(']', '');

    try {
      // Fetch the real entity data from the backend
      const entity = await fetchEntityByName(cleanEntityName);
      setSelectedEntity(entity);
      setShowEntityDialog(true);
    } catch (error) {
      console.error('Failed to fetch entity details:', error);
      // Fallback: still open dialog but with minimal entity data
      const fallbackEntity: Entity = {
        id: 0,
        user_id: 0,
        name: cleanEntityName,
        type: 'PERSON',
        description: '',
        created_at: new Date(),
        updated_at: new Date(),
        card_count: 0,
        card_pk: null,
      };
      setSelectedEntity(fallbackEntity);
      setShowEntityDialog(true);
    }
  }

  function getPagedResults(): SearchResult[] {
    const filteredResults = searchResults
      .filter(result => !searchConfig.onlyParentCards || !result.id.includes("/"))
      .filter(result => searchConfig.showEntities || result.type !== "entity")
      .filter(result => searchConfig.showFacts || result.type !== "fact");

    const sortedResults = sortCards(
      filteredResults
        .filter(result => searchConfig.showCards || result.type !== "card"),
      searchConfig.sortBy
    );
    const indexOfLastItem = searchConfig.currentPage * 20;
    const indexOfFirstItem = indexOfLastItem - 20;
    return sortedResults.slice(indexOfFirstItem, indexOfLastItem);
  }

  function getTotalPages() {
    const totalItems = searchConfig.onlyParentCards
      ? searchResults.filter(result => !result.id.includes("/")).length
      : searchResults.length;
    return Math.ceil(totalItems / 20);
  }

  const handleOnlyParentCardsChange = (event) => {
    setSearchConfig({ ...searchConfig, onlyParentCards: event.target.checked, currentPage: 1 });
  };

  const handleShowPreviewChange = (event) => {
    setSearchConfig({ ...searchConfig, showPreview: event.target.checked });
  };

  const handleFullTextChange = (event) => {
    let config = { ...searchConfig, useFullText: event.target.checked }
    setSearchConfig(config);
    handleSearch(searchTerm, config);
  };

  const handleShowEntitiesChange = (event) => {
    setSearchConfig({ ...searchConfig, showEntities: event.target.checked, currentPage: 1 });
  };

  const handleShowFactsChange = (event) => {
    setSearchConfig({ ...searchConfig, showFacts: event.target.checked, currentPage: 1 });
  };

  const handleShowCardsChange = (event) => {
    setSearchConfig({ ...searchConfig, showCards: event.target.checked, currentPage: 1 });
  };

  const handleSearchTypeChange = (event) => {
    const newType = event.target.checked ? "typesense" : "classic";
    let config = { ...searchConfig, searchType: newType };
    setSearchConfig(config);
    handleSearch(searchTerm, config);
  };

  return (
    <div>
      <div>
        <div className="bg-slate-200 p-2 border-slate-400 border">
          <input
            style={{ display: "block", width: "100%", marginBottom: "10px" }}
            type="text"
            id="title"
            value={searchTerm}
            placeholder="Search"
            onChange={handleSearchUpdate}
            onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                handleSearch(searchTerm, searchConfig);
              }
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleSearch(searchTerm, searchConfig)}
              children={"Search"}
            />
            <select value={searchConfig.sortBy} onChange={handleSortChange}>
              <option value="sortByRanking">Ranking Score</option>
              <option value="sortCreatedNewOld">Creation Date (Newest)</option>
              <option value="sortCreatedOldNew">Creation Date (Oldest)</option>
              <option value="sortNewOld">Last Updated (Newest)</option>
              <option value="sortOldNew">Last Updated (Oldest)</option>
              <option value="sortBigSmall">A to Z</option>
              <option value="sortSmallBig">Z to A</option>
            </select>
            <SearchTagMenu
              tags={tags}
              handleTagClick={handleTagClick}
            />
            {!pinnedId &&
              <Button
                onClick={() => setShowPinSearchDialog(true)}
                children={"Pin Search"}
              />
            }

            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Search Options
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                <div className="py-1">
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.useFullText}
                        onChange={handleFullTextChange}
                        className="mr-2"
                      />
                      Search Full Text
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.onlyParentCards}
                        onChange={handleOnlyParentCardsChange}
                        className="mr-2"
                      />
                      Only Parent Cards
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.showPreview}
                        onChange={handleShowPreviewChange}
                        className="mr-2"
                      />
                      Show Preview
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.showEntities}
                        onChange={handleShowEntitiesChange}
                        className="mr-2"
                      />
                      Show Entities
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.showFacts}
                        onChange={handleShowFactsChange}
                        className="mr-2"
                      />
                      Show Facts
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.showCards}
                        onChange={handleShowCardsChange}
                        className="mr-2"
                      />
                      Show Cards
                    </label>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchConfig.searchType === "typesense"}
                        onChange={handleSearchTypeChange}
                        className="mr-2"
                      />
                      New Search (Experimental)
                    </label>
                  </div>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center w-full py-20">Loading</div>
        ) : (
          <div>
            {searchResults.length > 0 ? (
              <div>
                <SearchResultList
                  results={getPagedResults()}
                  showPreview={searchConfig.showPreview}
                  onEntityClick={handleEntityClick}
                  onTagClick={handleTagClick}
                />
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    onClick={() => setSearchConfig({ ...searchConfig, currentPage: searchConfig.currentPage - 1 })}
                    disabled={searchConfig.currentPage === 1}
                    children={"Previous"}
                  />
                  <span className="flex items-center">
                    Page {searchConfig.currentPage} of {getTotalPages()}
                  </span>
                  <Button
                    onClick={() => setSearchConfig({ ...searchConfig, currentPage: searchConfig.currentPage + 1 })}
                    disabled={searchConfig.currentPage === getTotalPages()}
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

      {/* Message display */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {message}
        </div>
      )}

      {/* Pin Search Dialog */}
      {showPinSearchDialog && (
        <PinSearchDialog
          searchTerm={searchTerm}
          searchConfig={searchConfig}
          onClose={() => setShowPinSearchDialog(false)}
          onPinSuccess={() => {
            // You might want to refresh something here
          }}
          setMessage={setMessage}
        />
      )}

    </div>
  );
}
