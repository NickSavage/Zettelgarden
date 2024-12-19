import React, { useState, useEffect } from "react";
import { Entity } from "../../models/Card";
import { fetchEntities, mergeEntities, deleteEntity } from "../../api/entities";
import { HeaderSection } from "../Header";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { EditEntityDialog } from "./EditEntityDialog";
import { EntityCard } from "./EntityCard";
import { EntityListToolbar } from "./EntityListToolbar";
import { EntitySelectionActions } from "./EntitySelectionActions";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
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
          return prev.filter((id) => id !== entity.id);
        } else {
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

  const handleDeleteClick = () => {
    if (selectedEntities.length === 0) return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEntities.length === 0) return;
    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      // Delete all selected entities
      for (const entityId of selectedEntities) {
        await deleteEntity(entityId);
      }
      setSelectedEntities([]);
      loadEntities();
    } catch (err) {
      setError("Failed to delete entities");
      console.error("Error deleting entities:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeselectAll = () => {
    setSelectedEntities([]);
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

  const handleEditClick = (entity: Entity, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingEntity(entity);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    loadEntities(); // Reload the entities list
  };

  if (loading) return <div className="p-4">Loading entities...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const primaryEntity = selectedEntities.length > 0
    ? entities.find((e) => e.id === selectedEntities[0])
    : null;

  return (
    <div className="p-4">
      <HeaderSection text="Entities" />

      <EntityListToolbar
        filterText={filterText}
        onFilterChange={setFilterText}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(newSortBy, newDirection) => {
          setSortBy(newSortBy);
          setSortDirection(newDirection);
        }}
      />

      <EntitySelectionActions
        selectedCount={selectedEntities.length}
        onMerge={handleMergeClick}
        onDelete={handleDeleteClick}
        onDeselect={handleDeselectAll}
        isMerging={isMerging}
        isDeleting={isDeleting}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getSortedEntities(filteredEntities).map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isSelected={selectedEntities.includes(entity.id)}
            selectionInfo={getSelectionInfo(entity.id)}
            onEdit={handleEditClick}
            onClick={handleEntityClick}
          />
        ))}
      </div>

      {filteredEntities.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {entities.length === 0 ? "No entities found" : "No matching entities"}
        </div>
      )}

      {showConfirmDialog && primaryEntity && (
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
      )}

      {showDeleteDialog && selectedEntities.length > 0 && (
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md mx-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Confirm Delete
            </Dialog.Title>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete {selectedEntities.length === 1 ? 'this entity' : 'these entities'}?
              </p>
              <ul className="list-disc pl-5">
                {selectedEntities.map((id) => {
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
              This action cannot be undone. {selectedEntities.length === 1 ? 'The entity' : 'These entities'} will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </Dialog>
      )}

      <EditEntityDialog
        entity={editingEntity}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEntity(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
