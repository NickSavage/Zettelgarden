import React, { useState } from "react";
import { useTagContext } from "../../contexts/TagContext";
import { TagListItem } from "./TagListItem";

interface TagListInterface {}

type SortOption = "name" | "name-desc" | "tasks-asc" | "tasks-desc" | "cards-asc" | "cards-desc";

export function TagList({}: TagListInterface) {
  const { tags } = useTagContext();
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [filterText, setFilterText] = useState<string>("");

  const filteredTags = (tags || []).filter(tag =>
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const sortedTags = [...filteredTags].sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "tasks-asc":
        return a.task_count - b.task_count;
      case "tasks-desc":
        return b.task_count - a.task_count;
      case "cards-asc":
        return a.card_count - b.card_count;
      case "cards-desc":
        return b.card_count - a.card_count;
      default:
        return 0;
    }
  });

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-2xl font-bold mb-4">Tags</h2>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label className="mr-2">Filter:</label>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-full md:w-auto"
            placeholder="Filter by name"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="mr-2">Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="border border-gray-300 rounded px-2 py-1 w-full"
          >
            <option value="name">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="tasks-asc">Least Tasks</option>
            <option value="tasks-desc">Most Tasks</option>
            <option value="cards-asc">Least Cards</option>
            <option value="cards-desc">Most Cards</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTags.length > 0 ? (
          sortedTags.map((tag) => <TagListItem key={tag.id} tag={tag} />)
        ) : (
          <div className="text-center text-gray-500">No tags available</div>
        )}
      </div>
    </div>
  );
}
