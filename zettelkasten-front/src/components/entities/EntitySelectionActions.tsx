import React from "react";

interface EntitySelectionActionsProps {
  selectedCount: number;
  onMerge: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  isMerging: boolean;
  isDeleting: boolean;
}

export function EntitySelectionActions({
  selectedCount,
  onMerge,
  onDelete,
  onDeselect,
  isMerging,
  isDeleting,
}: EntitySelectionActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-2">
        {selectedCount === 1 ? (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Entity"}
          </button>
        ) : (
          <>
            <button
              onClick={onMerge}
              disabled={isMerging}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isMerging ? "Merging..." : `Merge ${selectedCount} Entities`}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedCount} Entities`}
            </button>
          </>
        )}
        <button
          onClick={onDeselect}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Deselect All
        </button>
      </div>
      {selectedCount > 1 && (
        <p className="text-sm text-gray-600">
          For merging: First selected entity will be kept, others will be merged into it.
        </p>
      )}
    </div>
  );
} 