import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, PartialCard, Entity } from "../../models/Card";
import { File } from "../../models/File";
import { removeEntityFromCard, addEntityToCard, fetchEntities } from "../../api/entities";

import {
  HeaderTop,
  HeaderSection,
  HeaderSubSection,
} from "../../components/Header";
import { compareCardIds } from "../../utils/cards";
import { isErrorResponse } from "../../models/common";

import { saveExistingCard, fetchRelatedCards } from "../../api/cards";
import { SearchResultList } from "../../components/cards/SearchResultList";

import { FileListItem } from "../../components/files/FileListItem";

import { ChildrenCards } from "../../components/cards/ChildrenCards";
import { CardList } from "../../components/cards/CardList";

interface ViewCardTabbedDisplay {
  viewingCard: Card;
  setViewCard: (card: Card) => void;
  setError: (error: string) => void;
}

export function ViewCardTabbedDisplay({
  viewingCard,
  setViewCard,
  setError,
}: ViewCardTabbedDisplay) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("Children");
  const [relatedCards, setRelatedCards] = useState<PartialCard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tabs = [
    { label: "Children" },
    { label: "References" },
    { label: "Related" },
    { label: "Files" },
    { label: "Entities" },
  ];

  function onFileDelete(file_id: number) {}
  function handleViewCard(card_id: number) {}
  function openRenameModal(file: File) {}

  function handleTabClick(label: string) {
    setActiveTab(label);
  }

  async function handleDisplayFileOnCardClick(file: File) {
    if (viewingCard === null) {
      return;
    }

    let editedCard = {
      ...viewingCard,
      body: viewingCard.body + "\n\n![](" + file.id + ")",
    };
    let response = await saveExistingCard(editedCard);
    setViewCard(editedCard);
  }

  async function handleFetchRelatedCards(id: string) {
    let response = await fetchRelatedCards(id);

    if (isErrorResponse(response)) {
      setError(response["error"]);
    } else {
      setRelatedCards(response);
    }
  }

  useEffect(() => {
    handleFetchRelatedCards(viewingCard.id.toString());
  }, [viewingCard]);

  async function handleRemoveEntity(entityId: number) {
    try {
      await removeEntityFromCard(entityId, viewingCard.id);
      // Update the viewingCard by removing the entity
      setViewCard({
        ...viewingCard,
        entities: viewingCard.entities?.filter(entity => entity.id !== entityId) || []
      });
    } catch (error) {
      setError("Failed to remove entity from card");
    }
  }

  useEffect(() => {
    loadEntities();
  }, []);

  async function loadEntities() {
    try {
      const entities = await fetchEntities();
      setAllEntities(entities);
    } catch (error) {
      setError("Failed to load entities");
    }
  }

  async function handleAddEntity(entityId: number) {
    try {
      await addEntityToCard(entityId, viewingCard.id);
      // Find the entity in allEntities and add it to the card
      const entityToAdd = allEntities.find(e => e.id === entityId);
      if (entityToAdd && viewingCard.entities) {
        setViewCard({
          ...viewingCard,
          entities: [...viewingCard.entities, entityToAdd]
        });
      }
    } catch (error) {
      setError("Failed to add entity to card");
    }
  }

  const filteredEntities = allEntities.filter(entity => 
    !viewingCard.entities?.some(e => e.id === entity.id) && // Not already added
    (entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     entity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     entity.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            onClick={() => handleTabClick(tab.label)}
            className={`
            cursor-pointer font-medium py-1.5 px-3 rounded-md flex items-center
            ${
              activeTab === tab.label
                ? "text-blue-600 border-b-4 border-blue-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }
          `}
          >
            {tab.label}
            <span className="ml-1 text-xs font-semibold bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
              {tab.label === "Children" && viewingCard.children.length}
              {tab.label === "References" && viewingCard.references.length}
              {tab.label === "Related" && relatedCards.length}
              {tab.label === "Files" && viewingCard.files.length}
              {tab.label === "Entities" && viewingCard.entities && viewingCard.entities.length}
            </span>
          </span>
        ))}
      </div>
      {activeTab === "References" && (
        <div>
          <HeaderSubSection text="References" />
          <CardList
            cards={viewingCard.references.sort((a, b) =>
              compareCardIds(a.card_id, b.card_id),
            )}
          />
        </div>
      )}
      {activeTab === "Children" && (
        <div>
          {viewingCard.children.length > 0 && (
            <div>
              <HeaderSubSection text="Children" />
              <ChildrenCards
                allChildren={viewingCard.children.sort((a, b) =>
                  compareCardIds(a.card_id, b.card_id),
                )}
                card={viewingCard}
              />
            </div>
          )}
        </div>
      )}
      {activeTab === "Related" && (
        <div>
          <HeaderSubSection text="Related Cards" />
          <CardList cards={relatedCards} />
        </div>
      )}
      {activeTab === "Files" && (
        <div>
          {viewingCard.files.length > 0 && (
            <div>
              <ul>
                {viewingCard.files.map((file, index) => (
                  <FileListItem
                    file={file}
                    onDelete={onFileDelete}
                    setRefreshFiles={(refresh: boolean) => {}}
                    displayFileOnCard={(file: File) => {
                      handleDisplayFileOnCardClick(file);
                    }}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {activeTab === "Entities" && (
        <div>
          <HeaderSubSection text="Entities" />
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Existing entities */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Attached Entities</h3>
            <ul>
              {viewingCard.entities && viewingCard.entities.map((entity) => (
                <li 
                  key={entity.id} 
                  className="mb-2 p-2 hover:bg-gray-100 rounded flex justify-between items-center"
                >
                  <div 
                    className="cursor-pointer flex-grow"
                    onClick={() => navigate(`/app/search?term=@[${entity.name}]`)}
                  >
                    <div className="font-semibold">{entity.name}</div>
                    <div className="text-sm text-gray-600">{entity.description}</div>
                    <div className="text-xs text-gray-500">Type: {entity.type}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveEntity(entity.id);
                    }}
                    className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Search results */}
          {searchTerm && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
              <ul>
                {filteredEntities.map((entity) => (
                  <li 
                    key={entity.id} 
                    className="mb-2 p-2 hover:bg-gray-100 rounded flex justify-between items-center cursor-pointer"
                    onClick={() => handleAddEntity(entity.id)}
                  >
                    <div>
                      <div className="font-semibold">{entity.name}</div>
                      <div className="text-sm text-gray-600">{entity.description}</div>
                      <div className="text-xs text-gray-500">Type: {entity.type}</div>
                    </div>
                    <button
                      className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
