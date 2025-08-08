import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Menu } from '@headlessui/react';
import { semanticSearchCards } from "../../api/cards";
import { fetchUserTags } from "../../api/tags";
import { SearchResult } from "../../models/Card";
import { Tag } from "../../models/Tags";
import { sortCards } from "../../utils/cards";
import { Button } from "../../components/Button";
import { SearchResultList } from "../../components/cards/SearchResultList";
import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { PinSearchDialog } from "../../components/search/PinSearchDialog";
import { getPinnedSearches } from "../../api/pinnedSearches";
import { useTagContext } from "../../contexts/TagContext";
import { EntityDialog } from "../../components/entities/EntityDialog";
import { Entity } from "../../models/Card";
import { fetchEntityByName } from "../../api/entities";

interface SearchPageProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  searchConfig: {
    sortBy: string;
    currentPage: number;
    useClassicSearch: boolean;
    useFullText: boolean;
    onlyParentCards: boolean;
    showEntities: boolean;
    showPreview: boolean;
  };
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
  const [selectedEntityForDialog, setSelectedEntityForDialog] = useState<Entity | null>(null);
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const latestRequestId = React.useRef(0);

  const params = new URLSearchParams(location.search);
  const pinnedId = params.get("pinned");

  function handleSearchUpdate(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  async function handleSearch(classicSearch: boolean, inputTerm: string) {
    const requestId = ++latestRequestId.current;

    setIsLoading(true);
    setError(null);

    const term = inputTerm || "";
    console.log("searching for term:", term);

    try {
      const results = await semanticSearchCards(term, classicSearch, searchConfig.useFullText, searchConfig.showEntities);
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
      document.title = "Zettelgarden - Search";
      const params = new URLSearchParams(location.search);
      const recent = params.get("recent");
      const term = params.get("term") || "";
      const pinnedId = params.get("pinned");

      let classicSearch = searchConfig.useClassicSearch;

      // Check if we're loading a pinned search
      if (pinnedId) {
        try {
          const pinnedSearches = await getPinnedSearches();
          const pinnedSearch = pinnedSearches.find(search => search.id === parseInt(pinnedId));

          if (pinnedSearch) {
            // Apply the pinned search configuration
            setSearchTerm(pinnedSearch.searchTerm);
            setSearchConfig({
              ...searchConfig,
              ...pinnedSearch.searchConfig
            });

            // Execute the search with the pinned configuration
            await handleSearch(
              pinnedSearch.searchConfig.useClassicSearch,
              pinnedSearch.searchTerm
            );
            return; // Exit early since we've handled the search
          }
        } catch (error) {
          console.error("Error loading pinned search:", error);
          setMessage("Error loading pinned search");
        }
      }

      // Regular search initialization if not a pinned search
      if (recent !== null) {
        classicSearch = true;
        setSearchConfig({ ...searchConfig, useClassicSearch: true });
        setSearchTerm("");
        await handleSearch(true, "");
      } else if (term) {
        classicSearch = true;
        setSearchConfig({ ...searchConfig, useClassicSearch: true });
        setSearchTerm(term);
        await handleSearch(true, term);
      } else {
        if (!classicSearch) {
          setSearchConfig({ ...searchConfig, sortBy: "sortByRanking" });
        }
        await handleSearch(classicSearch, "");
      }
    };

    initializeSearch();
  }, [location.search]); // Re-run when the URL search parameters change

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchConfig({ ...searchConfig, sortBy: e.target.value });
  }

  function handleTagClick(tagName: string) {
    setSearchTerm("#" + tagName);
    handleSearch(searchConfig.useClassicSearch, tagName);
  }

  async function handleEntityClick(entityName: string) {
    // Extract entity name from @[EntityName] format
    const cleanEntityName = entityName.replace('@[', '').replace(']', '');
    
    try {
      // Fetch the real entity data from the backend
      const entity = await fetchEntityByName(cleanEntityName);
      setSelectedEntityForDialog(entity);
      setIsEntityDialogOpen(true);
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
      setSelectedEntityForDialog(fallbackEntity);
      setIsEntityDialogOpen(true);
    }
  }

  function getPagedResults(): SearchResult[] {
    const filteredResults = searchResults
      .filter(result => result.score > 0)
      .filter(result => !searchConfig.onlyParentCards || !result.id.includes("/"))
      .filter(result => searchConfig.showEntities || result.type !== "entity");

    const sortedResults = sortCards(filteredResults, searchConfig.sortBy);
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

  const handleCheckboxChange = (event) => {
    const newClassicSearch = event.target.checked;
    setSearchConfig({
      ...searchConfig,
      useClassicSearch: newClassicSearch,
      sortBy: !newClassicSearch ? "sortByRanking" : searchConfig.sortBy,
      currentPage: 1
    });
    setSearchResults([]);
    handleSearch(newClassicSearch, searchTerm);
  };

  const handleOnlyParentCardsChange = (event) => {
    setSearchConfig({ ...searchConfig, onlyParentCards: event.target.checked, currentPage: 1 });
  };

  const handleShowPreviewChange = (event) => {
    setSearchConfig({ ...searchConfig, showPreview: event.target.checked });
  };

  const handleFullTextChange = (event) => {
    setSearchConfig({ ...searchConfig, useFullText: event.target.checked });
    handleSearch(searchConfig.useClassicSearch, searchTerm);
  };

  const handleShowEntitiesChange = (event) => {
    setSearchConfig({ ...searchConfig, showEntities: event.target.checked, currentPage: 1 });
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
                handleSearch(searchConfig.useClassicSearch, searchTerm);
              }
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleSearch(searchConfig.useClassicSearch, searchTerm)}
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
                        checked={searchConfig.useClassicSearch}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      Use Classic Search
                    </label>
                  </div>
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

      {/* Entity Dialog */}
      <EntityDialog
        entity={selectedEntityForDialog}
        isOpen={isEntityDialogOpen}
        onClose={() => setIsEntityDialogOpen(false)}
      />
    </div>
  );
}
