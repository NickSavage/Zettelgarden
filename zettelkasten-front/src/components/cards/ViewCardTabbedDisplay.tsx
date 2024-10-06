import React, { useState, useEffect } from "react";
import { Card, PartialCard } from "../../models/Card";
import { File } from "../../models/File";

import {
  HeaderTop,
  HeaderSection,
  HeaderSubSection,
} from "../../components/Header";
import { compareCardIds } from "../../utils/cards";
import { isErrorResponse } from "../../models/common";

import { saveExistingCard, fetchRelatedCards } from "../../api/cards";
import { CardList } from "../../components/cards/CardList";

import { FileListItem } from "../../components/files/FileListItem";

import { ChildrenCards } from "../../components/cards/ChildrenCards";

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
  const [activeTab, setActiveTab] = useState<string>("Children");
  const [relatedCards, setRelatedCards] = useState<PartialCard[]>([]);

  const tabs = [
    { label: "Children" },
    { label: "References" },
    { label: "Related" },
    { label: "Files" },
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
    </div>
  );
}
