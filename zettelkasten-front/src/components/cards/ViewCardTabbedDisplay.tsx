import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, PartialCard, Entity } from "../../models/Card";
import { File } from "../../models/File";
import { removeEntityFromCard, addEntityToCard, fetchEntities } from "../../api/entities";
import { saveExistingCard, getCardAuditEvents } from "../../api/cards";

import {
  HeaderSubSection,
} from "../../components/Header";
import { compareCardIds } from "../../utils/cards";
import { isErrorResponse } from "../../models/common";

import { FileListItem } from "../../components/files/FileListItem";

import { ChildrenCards } from "../../components/cards/ChildrenCards";

// Props interface
import { SummarizeJobResponse } from "../../api/summarizer";

interface ViewCardTabbedDisplayProps {
  viewingCard: Card;
  setViewCard: (card: Card) => void;
  setError: (error: string) => void;
  handleOpenEntity: (entity: Entity) => void;
  summaries: SummarizeJobResponse[] | null;
}

interface AuditChange {
  field: string;
  from: any;
  to: any;
}

function formatFieldName(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
}

function renderDiff(change: AuditChange) {
  const fieldName = formatFieldName(change.field);

  if (typeof change.from === 'string' && typeof change.to === 'string') {
    return (
      <div className="flex flex-col space-y-1">
        <div className="text-sm font-medium text-gray-700">{fieldName}</div>
        <div className="flex flex-col space-y-1 pl-4">
          <div className="text-red-600 line-through bg-red-50 px-2 py-1 rounded">
            {change.from || '(empty)'}
          </div>
          <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
            {change.to || '(empty)'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="text-sm font-medium text-gray-700">{fieldName}</div>
      <div className="text-gray-600 pl-4">
        Changed from <code className="bg-gray-100 px-1 rounded">{JSON.stringify(change.from)}</code>
        {' '}to{' '}
        <code className="bg-gray-100 px-1 rounded">{JSON.stringify(change.to)}</code>
      </div>
    </div>
  );
}

function parseAuditEvent(event: any) {
  const changes: AuditChange[] = [];

  if (event.details?.changes) {
    Object.entries(event.details.changes).forEach(([field, values]: [string, any]) => {
      if (typeof values === 'object' && values !== null) {
        if ('from' in values && 'to' in values) {
          changes.push({
            field,
            from: values.from,
            to: values.to
          });
        } else {
          Object.entries(values).forEach(([subField, subValues]: [string, any]) => {
            if (typeof subValues === 'object' && subValues !== null && 'from' in subValues && 'to' in subValues) {
              changes.push({
                field: `${field}.${subField}`,
                from: subValues.from,
                to: subValues.to
              });
            }
          });
        }
      }
    });
  }

  return changes;
}

function getEventIcon(eventType: string) {
  switch (eventType.toLowerCase()) {
    case 'update':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    case 'create':
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'delete':
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export function ViewCardTabbedDisplay({
  viewingCard,
  setViewCard,
  setError,
  handleOpenEntity,
  // Destructure summaries here
  summaries,
  // Use new props interface
}: ViewCardTabbedDisplayProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("Entities");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [fileFilterString, setFileFilterString] = useState<string>("");

  const tabs = [
    { label: "Entities" },
    { label: "Summaries" },
    { label: "Files" },
    { label: "History" },
  ];

  function onFileDelete(file_id: number) { }

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

  useEffect(() => {
    if (activeTab === "History") {
      getCardAuditEvents(viewingCard.id.toString())
        .then(events => setAuditEvents(events))
        .catch(error => setError("Failed to load audit events"));
    }
  }, [activeTab, viewingCard.id]);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  return (
    <div>
      <div className="flex">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            onClick={() => handleTabClick(tab.label)}
            className={`
            cursor-pointer font-medium py-1.5 px-3 rounded-md flex items-center
            ${activeTab === tab.label
                ? "text-blue-600 border-b-4 border-blue-600"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }
          `}
          >
            {tab.label}
            {tab.label !== "History" &&
              <span className="ml-1 text-xs font-semibold bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
                {tab.label === "Files" && viewingCard.files.length}
                {tab.label === "Entities" && viewingCard.entities && viewingCard.entities.length}
                {tab.label === "Summaries" && summaries && summaries.length}
              </span>
            }
          </span>
        ))}
      </div>

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
      {activeTab === "Files" && (
        <div>
          {viewingCard.files.length > 0 && (
            <div>
              <ul>
                {viewingCard.files.map((file, index) => (
                  <FileListItem
                    file={file}
                    onDelete={onFileDelete}
                    setRefreshFiles={(refresh: boolean) => { }}
                    displayFileOnCard={(file: File) => {
                      handleDisplayFileOnCardClick(file);
                    }}
                    filterString={fileFilterString}
                    setFilterString={setFileFilterString}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {activeTab === "Entities" && (
        <div>
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
                    onClick={() => handleOpenEntity(entity)}
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
      {activeTab === "History" && (
        <div className="p-4">
          <div className="space-y-4 mt-4">
            {auditEvents.map((event, index) => {
              const changes = parseAuditEvent(event);
              const eventType = event.details?.change_type || 'unknown';
              return (
                <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(eventType)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900 capitalize">
                            {eventType.toLowerCase()}
                          </span>
                          <span className="text-gray-600 ml-2">by User {event.user_id}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(event.created_at)}</span>
                      </div>
                      {changes.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {changes.map((change, idx) => (
                            <div key={idx}>
                              {renderDiff(change)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {auditEvents.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No audit events found
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === "Summaries" && (
        <div className="p-4">
          <div className="mt-2 space-y-2">
            {summaries && summaries.length > 0 ? (
              summaries.map((s) => (
                <div key={s.id} className="border-b pb-2">
                  <div className="text-xs text-gray-500">
                    #{s.id} - {s.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No summaries available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
