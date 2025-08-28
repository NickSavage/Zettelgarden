import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom"; // Import Link
import { Entity } from "../../models/Card";
import { PartialCard, SearchResult, defaultPartialCard } from "../../models/Card";
import { semanticSearchCards } from "../../api/cards";
import { CardList } from "../cards/CardList";
import { CardTag } from "../cards/CardTag"; // Import CardTag
import { Button } from "../Button";
import { FactWithCard } from "../../models/Fact";
import { getEntityFacts } from "../../api/entities";
import { useShortcutContext } from "../../contexts/ShortcutContext";

interface EntityDialogProps {
    onClose: () => void;
    onEdit?: (entity: Entity, event: React.MouseEvent) => void;
}

export function EntityDialog({ onClose, onEdit }: EntityDialogProps) {
    const [associatedCards, setAssociatedCards] = useState<PartialCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facts, setFacts] = useState<FactWithCard[]>([]);
    const [factsError, setFactsError] = useState<string | null>(null);
    const [factsLoading, setFactsLoading] = useState(false);

    const {
        showEntityDialog,
        setShowEntityDialog,
        selectedEntity,
        setSelectedEntity,
        showFactDialog,
        setShowFactDialog,
        selectedFact,
        setSelectedFact,
    } = useShortcutContext();

    function handleFactClick(fact: FactWithCard) {
        setSelectedFact(fact)
        setShowFactDialog(true)
        setShowEntityDialog(false)
    }

    const handleEditClick = () => {
        if (selectedEntity && onEdit) {
            onEdit(selectedEntity, {} as React.MouseEvent);
            onClose();
        }
    };

    useEffect(() => {
        if (showEntityDialog && selectedEntity) {
            setIsLoading(true);
            setError(null);
            setAssociatedCards([]); // Clear previous cards

            semanticSearchCards(`@[${selectedEntity.name}]`, false, false, false)
                .then((results: SearchResult[]) => {
                    if (results === null) {
                        setAssociatedCards([]);
                        return;
                    }
                    const cards: PartialCard[] = results.map(result => ({
                        id: Number(result.metadata?.id) || 0,
                        card_id: result.id, // This is the string ID like "1.1"
                        title: result.title,
                        body: result.preview || "", // Or handle if preview is not what's needed
                        link: "", // Or construct a link if necessary
                        is_deleted: false, // Assuming not deleted if shown
                        created_at: new Date(result.created_at),
                        updated_at: new Date(result.updated_at),
                        parent_id: result.metadata?.parent_id || 0,
                        user_id: 0, // Or get from metadata if available
                        // Ensure all fields of PartialCard are covered
                        // These might need to be fetched or are not relevant for this list
                        parent: defaultPartialCard,
                        files: [],
                        children_count: 0,
                        references_count: 0,
                        tags: result.tags || [],
                        tasks_count: 0,
                        is_public: false,
                        is_template: false,
                        is_pinned: false,
                        rating: 0,
                        card_type: result.metadata?.card_type || "note",
                        // entities: result.entities || [], // Removed as SearchResult doesn't have .entities directly and PartialCard doesn't store them
                    }));
                    setAssociatedCards(cards);
                })
                .catch((err) => {
                    console.error("Error fetching cards for entity:", err);
                    setError("Failed to load associated cards.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
            // fetch facts
            setFacts([]);
            setFactsError(null);
            setFactsLoading(true);

            getEntityFacts(selectedEntity.id)
                .then((res) => setFacts(res ?? []))
                .catch((err) => {
                    console.error("Error fetching facts:", err);
                    setFactsError("Failed to load facts.");
                    setFacts([]); // keep array
                })
                .finally(() => setFactsLoading(false));
        }
    }, [showEntityDialog, selectedEntity]);

    return (
        <Dialog open={showEntityDialog} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-y-auto max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-2">
                        {selectedEntity ? `Entity: ${selectedEntity.name}` : "Entity Details"}
                    </Dialog.Title>

                    {selectedEntity && (
                        <div className="mb-4 space-y-2 text-sm">
                            {selectedEntity.description && (
                                <p className="text-gray-700">{selectedEntity.description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                                <p>Created: {new Date(selectedEntity.created_at).toLocaleDateString()}</p>
                                <p>Updated: {new Date(selectedEntity.updated_at).toLocaleDateString()}</p>
                            </div>

                            <h4 className="text-md font-medium text-gray-800 mt-4 border-t pt-3">Facts:</h4>
                            <div className="min-h-[100px] max-h-[30vh] overflow-y-auto pr-2">
                                {factsLoading && <p>Loading facts...</p>}
                                {factsError && <p className="text-red-600">{factsError}</p>}
                                {!factsLoading && !factsError && facts.length === 0 && (
                                    <p>No facts linked to this entity.</p>
                                )}
                                {!factsLoading && !factsError && facts.length > 0 && (
                                    <ul className="space-y-2">
                                        {facts.map((f) => (
                                            <li
                                                key={f.id}
                                                onClick={() => handleFactClick(f)}
                                                className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                            >
                                                <p className="text-sm text-gray-700">• {f.fact}</p>
                                                {f.card && (
                                                    <span className="text-xs text-blue-600">
                                                        <CardTag card={f.card} showTitle={true} />
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {selectedEntity.card && selectedEntity.card.id > 0 && (
                                <div className="mt-1">
                                    <span className="text-xs text-gray-600">Linked Card: </span>
                                    <Link
                                        to={`/app/card/${selectedEntity.card.id}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <CardTag card={selectedEntity.card} showTitle={true} />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <h4 className="text-md font-medium text-gray-800 mb-2 border-t pt-3">Associated Cards:</h4>
                    <div className="min-h-[150px] max-h-[50vh] overflow-y-auto pr-2">
                        {isLoading && <p>Loading cards...</p>}
                        {error && <p className="text-red-600">{error}</p>}
                        {!isLoading && !error && associatedCards.length === 0 && (
                            <p>No cards found for this entity.</p>
                        )}
                        {!isLoading && !error && associatedCards.length > 0 && (
                            <CardList cards={associatedCards} showAddButton={false} />
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        {selectedEntity && onEdit && (
                            <Button
                                onClick={handleEditClick}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                            >
                                Edit
                            </Button>
                        )}
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
