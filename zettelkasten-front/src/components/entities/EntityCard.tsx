import React from "react";
import { Entity } from "../../models/Card";

interface EntityCardProps {
  entity: Entity;
  isSelected: boolean;
  selectionInfo: string | null;
  onEdit: (entity: Entity, event: React.MouseEvent) => void;
  onClick: (entity: Entity, event: React.MouseEvent) => void;
}

export function EntityCard({ entity, isSelected, selectionInfo, onEdit, onClick }: EntityCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer
        ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={(e) => onClick(entity, e)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {entity.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => onEdit(entity, e)}
            className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <span className="text-sm px-2 py-1 bg-gray-100 rounded-full text-gray-600">
            {entity.type}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-2">{entity.description}</p>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Cards: {entity.card_count}</span>
        <span>Updated: {entity.updated_at.toLocaleDateString()}</span>
      </div>

      {selectionInfo && (
        <div
          className={`mt-2 text-sm ${
            selectionInfo === "Primary"
              ? "text-green-600 font-semibold"
              : "text-blue-600"
          }`}
        >
          {selectionInfo}
        </div>
      )}
    </div>
  );
} 