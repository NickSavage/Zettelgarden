import React from "react";

interface EntityListToolbarProps {
  filterText: string;
  onFilterChange: (value: string) => void;
  sortBy: "name" | "cards";
  sortDirection: "asc" | "desc";
  onSortChange: (sortBy: "name" | "cards", direction: "asc" | "desc") => void;
}

export function EntityListToolbar({
  filterText,
  onFilterChange,
  sortBy,
  sortDirection,
  onSortChange,
}: EntityListToolbarProps) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        placeholder="Filter entities..."
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={`${sortBy}-${sortDirection}`}
        onChange={(e) => {
          const [newSortBy, newDirection] = e.target.value.split("-") as [
            "name" | "cards",
            "asc" | "desc"
          ];
          onSortChange(newSortBy, newDirection);
        }}
        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="cards-desc">Most Cards</option>
        <option value="cards-asc">Least Cards</option>
      </select>
    </div>
  );
} 