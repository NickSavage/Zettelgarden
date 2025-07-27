import React, { useState, useEffect } from "react";
import { Entity } from "../models/Card";
import { fetchEntities, mergeEntities, deleteEntity } from "../api/entities";
import { HeaderSection } from "../components/Header";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { EditEntityDialog } from "../components/entities/EditEntityDialog";
import { EntityDialog } from "../components/entities/EntityDialog"; // Import the new dialog
import { EntityCard } from "../components/entities/EntityCard";
import { EntityListToolbar } from "../components/entities/EntityListToolbar";
import { EntitySelectionActions } from "../components/entities/EntitySelectionActions";

export function EntityPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "cards" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedEntities, setSelectedEntities] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
  const [selectedEntityForDialog, setSelectedEntityForDialog] = useState<Entity | null>(null); // State for the new dialog
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false); // State for new dialog visibility
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
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
    setCurrentPage(1);
  }, [filterText, entities]);

  const handleEntityClick = (entity: Entity, event: React.MouseEvent) => {
    if (selectionMode || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setSelectedEntities((prev) => {
        const index = prev.indexOf(entity.id);
        if (index !== -1) {
          return prev.filter((id) => id !== entity.id);
        } else {
          return [...prev, entity.id];
        }
      });
    } else {
      // navigate(`/app/search?term=@[${entity.name}]`); // Old navigation
      event.preventDefault(); // Prevent any default action if EntityCard is wrapped in <a> or similar
      setSelectedEntityForDialog(entity);
      setIsEntityDialogOpen(true);
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
    const entitiesToDelete = entityToDelete
      ? [entityToDelete.id]
      : selectedEntities;

    if (entitiesToDelete.length === 0) return;

    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      for (const entityId of entitiesToDelete) {
        await deleteEntity(entityId);
      }
      setSelectedEntities([]);
      setEntityToDelete(null);
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
      } else if (sortBy === "cards") {
        return sortDirection === "asc"
          ? a.card_count - b.card_count
          : b.card_count - a.card_count;
      } else { // created_at
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortDirection === "asc"
          ? aDate - bDate
          : bDate - aDate;
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

  const handleSelectionModeToggle = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedEntities([]);
    }
  };

  const handleSingleDelete = (entity: Entity) => {
    setEditingEntity(null);
    setShowEditDialog(false);
    setEntityToDelete(entity);
    setShowDeleteDialog(true);
  };

  const getPagedEntities = () => {
    const sortedEntities = getSortedEntities(filteredEntities);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedEntities.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredEntities.length / itemsPerPage);
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
          setCurrentPage(1);
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={handleSelectionModeToggle}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${selectionMode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
        >
          {selectionMode ? (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exit Selection
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              Select Mode
            </span>
          )}
        </button>

        {(selectionMode || selectedEntities.length > 0) && (
          <>
            <div className="h-6 w-px bg-gray-300"></div>
            <EntitySelectionActions
              selectedCount={selectedEntities.length}
              onMerge={handleMergeClick}
              onDelete={handleDeleteClick}
              isMerging={isMerging}
              isDeleting={isDeleting}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getPagedEntities().map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isSelected={selectedEntities.includes(entity.id)}
            selectionInfo={getSelectionInfo(entity.id)}
            selectionMode={selectionMode}
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

      {filteredEntities.length > 0 && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="flex items-center">
            Page {currentPage} of {getTotalPages()}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === getTotalPages()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {showConfirmDialog && primaryEntity && (
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md mx-auto relative">
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

      {showDeleteDialog && (
        <Dialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setEntityToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md mx-auto relative">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Confirm Delete
            </Dialog.Title>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete {entityToDelete ? 'this entity' : 'these entities'}?
              </p>
              <ul className="list-disc pl-5">
                {(entityToDelete ? [entityToDelete] : selectedEntities.map(id => entities.find(e => e.id === id))).map((entity) => {
                  return entity ? (
                    <li key={entity.id} className="text-gray-700">
                      {entity.name} ({entity.type})
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            <p className="text-red-600 text-sm mb-4">
              This action cannot be undone. {entityToDelete ? 'The entity' : 'These entities'} will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setEntityToDelete(null);
                }}
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
        onDelete={handleSingleDelete}
      />

      <EntityDialog
        entity={selectedEntityForDialog}
        isOpen={isEntityDialogOpen}
        onClose={() => setIsEntityDialogOpen(false)}
      />
    </div>
  );
}
