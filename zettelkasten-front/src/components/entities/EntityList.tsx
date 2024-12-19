import React, { useState, useEffect } from "react";
import { Entity } from "../../models/Card";
import { fetchEntities, mergeEntities } from "../../api/entities";
import { HeaderSection } from "../Header";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";

export function EntityList() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "cards">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedEntities, setSelectedEntities] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const loadEntities = () => {
    setLoading(true);
    fetchEntities()
      .then((fetchedEntities) => {
        setEntities(fetchedEntities);
        setFilteredEntities(fetchedEntities);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load entities");
        setLoading(false);
        console.error("Error fetching entities:", err);
      });
  };

  useEffect(() => {
    loadEntities();
  }, []);

  useEffect(() => {
    const filtered = entities.filter((entity) => {
      const searchTerm = filterText.toLowerCase();
      return (
        entity.name.toLowerCase().includes(searchTerm) ||
        entity.type.toLowerCase().includes(searchTerm) ||
        entity.description.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredEntities(filtered);
  }, [filterText, entities]);

  const handleEntityClick = (entity: Entity, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setSelectedEntities((prev) => {
        const index = prev.indexOf(entity.id);
        if (index !== -1) {
          // Remove from selection
          return prev.filter((id) => id !== entity.id);
        } else {
          // Add to selection
          return [...prev, entity.id];
        }
      });
    } else if (selectedEntities.length === 0) {
      navigate(`/app/search?term=@[${entity.name}]`);
    }
  };

  const handleMergeClick = () => {
    if (selectedEntities.length < 2) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmMerge = async () => {
    setShowConfirmDialog(false);
    setIsMerging(true);
    const baseEntity = selectedEntities[0];

    try {
      // Merge all other entities into the first one
      for (let i = 1; i < selectedEntities.length; i++) {
        await mergeEntities(baseEntity, selectedEntities[i]);
      }
      // Reset selection and refresh the list
      setSelectedEntities([]);
      loadEntities();
    } catch (err) {
      setError("Failed to merge entities");
      console.error("Error merging entities:", err);
    } finally {
      setIsMerging(false);
    }
  };

  const getSelectionInfo = (entityId: number) => {
    const index = selectedEntities.indexOf(entityId);
    if (index === -1) return null;
    if (index === 0) return "Primary";
    return `Will merge into ${entities.find((e) => e.id === selectedEntities[0])
      ?.name}`;
  };

  const getSortedEntities = (entities: Entity[]) => {
    return [...entities].sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === "asc"
          ? a.card_count - b.card_count
          : b.card_count - a.card_count;
      }
    });
  };

  if (loading) {
    return <div className="p-4">Loading entities...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  const primaryEntity =
    selectedEntities.length > 0
      ? entities.find((e) => e.id === selectedEntities[0])
      : null;

  return (
    <div className="p-4">
      <HeaderSection text="Entities" />

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Filter entities..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={`${sortBy}-${sortDirection}`}
          onChange={(e) => {
            const [newSortBy, newDirection] = e.target.value.split("-") as [
              "name" | "cards",
              "asc" | "desc",
            ];
            setSortBy(newSortBy);
            setSortDirection(newDirection);
          }}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="cards-desc">Most Cards</option>
          <option value="cards-asc">Least Cards</option>
        </select>
      </div>

      {selectedEntities.length > 1 && (
        <div className="mb-4">
          <button
            onClick={handleMergeClick}
            disabled={isMerging}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isMerging
              ? "Merging..."
              : `Merge ${selectedEntities.length} Entities`}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            First selected entity will be kept, others will be merged into it.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getSortedEntities(filteredEntities).map((entity) => {
          const selectionInfo = getSelectionInfo(entity.id);
          return (
            <div
              key={entity.id}
              className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer
                ${
                  selectedEntities.includes(entity.id)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              onClick={(e) => handleEntityClick(entity, e)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {entity.name}
                </h3>
                <span className="text-sm px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {entity.type}
                </span>
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
        })}
      </div>

      {filteredEntities.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {entities.length === 0 ? "No entities found" : "No matching entities"}
        </div>
      )}

      {showConfirmDialog && primaryEntity && (
        <div>
          <div
            className="fixed inset-0 bg-black bg-opacity-30"
            aria-hidden="true"
          />
          <Dialog
            open={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md mx-auto">
              <Dialog.Title className="text-lg font-semibold mb-4">
                Confirm Merge
              </Dialog.Title>
              <div className="mb-4">
                <p className="font-medium text-green-600 mb-2">
                  Primary Entity (will be kept):
                  <br />
                  {primaryEntity.name} ({primaryEntity.type})
                </p>
                <p className="text-gray-600 mb-2">
                  The following entities will be merged into{" "}
                  {primaryEntity.name}:
                </p>
                <ul className="list-disc pl-5">
                  {selectedEntities.slice(1).map((id) => {
                    const entity = entities.find((e) => e.id === id);
                    return entity ? (
                      <li key={id} className="text-gray-700">
                        {entity.name} ({entity.type})
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
              <p className="text-red-600 text-sm mb-4">
                This action cannot be undone. The merged entities will be
                deleted.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMerge}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Merge
                </button>
              </div>
            </Dialog.Panel>
          </Dialog>
        </div>
      )}
    </div>
  );
}
