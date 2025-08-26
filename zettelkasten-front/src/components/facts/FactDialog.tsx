import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";
import { FactWithCard } from "../../models/Fact";
import { CardTag } from "../cards/CardTag";
import { Button } from "../Button";
import { Entity } from "../../models/Card";
import { getFactEntities } from "../../api/entities";
import { getFactCards, getSimilarFacts } from "../../api/facts";
import { useShortcutContext } from "../../contexts/ShortcutContext";

interface FactDialogProps {
    onClose: () => void;
}

export function FactDialog({ onClose }: FactDialogProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [cardsError, setCardsError] = useState<string | null>(null);

    const {
        setShowEntityDialog,
        setSelectedEntity,
        showFactDialog,
        setShowFactDialog,
        selectedFact,
        setSelectedFact,
    } = useShortcutContext();

    function handleEntityClick(entity: Entity) {
        setShowFactDialog(false);
        setSelectedEntity(entity)
        setShowEntityDialog(true);
    }

    const [similarFacts, setSimilarFacts] = useState<FactWithCard[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [similarError, setSimilarError] = useState<string | null>(null);

    function handleFactClick(fact: FactWithCard) {
        setSelectedFact(fact);
        setShowFactDialog(true);
    }

    useEffect(() => {
        if (selectedFact) {
            setLoading(true);
            setError(null);
            getFactEntities(selectedFact.id)
                .then(setEntities)
                .catch(() => setError("Failed to load entities"))
                .finally(() => setLoading(false));

            setLoadingCards(true);
            setCardsError(null);
            getFactCards(selectedFact.id)
                .then(setCards)
                .catch(() => setCardsError("Failed to load cards"))
                .finally(() => setLoadingCards(false));

            setLoadingSimilar(true);
            setSimilarError(null);
            getSimilarFacts(selectedFact.id)
                .then(setSimilarFacts)
                .catch(() => setSimilarError("Failed to load similar facts"))
                .finally(() => setLoadingSimilar(false));
        } else {
            setEntities([]);
            setCards([]);
            setSimilarFacts([]);
        }
    }, [selectedFact]);

    return (
        <Dialog open={showFactDialog} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-2">
                        {selectedFact ? `Fact: ${selectedFact.fact.slice(0, 50)}...` : "Fact Details"}
                    </Dialog.Title>

                    {selectedFact ? (
                        <div className="mb-4 space-y-2 text-sm text-gray-700">
                            <p>{selectedFact.fact}</p>
                            {selectedFact.card && (
                                <div>
                                    <span className="text-xs text-gray-600">From: </span>
                                    <Link
                                        to={`/app/card/${selectedFact.card.id}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <CardTag card={selectedFact.card} showTitle={true} />
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No fact selected.</p>
                    )}

                    <h4 className="text-md font-medium text-gray-800 mt-4 border-t pt-3">Linked Entities:</h4>
                    <div className="min-h-[100px] max-h-[30vh] overflow-y-auto pr-2">
                        {loading && <p>Loading entities...</p>}
                        {error && <p className="text-red-600">{error}</p>}
                        {!loading && entities.length === 0 && <p>No entities linked.</p>}
                        {!loading && entities.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {entities.map((e) => (
                                    <li key={e.id} onClick={() => handleEntityClick(e)}>
                                        <span className="text-xs text-blue-600 cursor-pointer">
                                            {e.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <h4 className="text-md font-medium text-gray-800 mt-4 border-t pt-3">Linked Cards:</h4>
                    <div className="min-h-[100px] max-h-[30vh] overflow-y-auto pr-2">
                        {loadingCards && <p>Loading cards...</p>}
                        {cardsError && <p className="text-red-600">{cardsError}</p>}
                        {!loadingCards && cards.length === 0 && <p>No cards linked.</p>}
                        {!loadingCards && cards.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {cards.map((c) => (
                                    <li key={c.id}>
                                        <Link
                                            to={`/app/card/${c.id}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            <CardTag card={c} showTitle={true} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <h4 className="text-md font-medium text-gray-800 mt-4 border-t pt-3">Similar Facts:</h4>
                    <div className="min-h-[100px] max-h-[30vh] overflow-y-auto pr-2">
                        {loadingSimilar && <p>Loading similar facts...</p>}
                        {similarError && <p className="text-red-600">{similarError}</p>}
                        {!loadingSimilar && similarFacts.length === 0 && <p>No similar facts.</p>}
                        {!loadingSimilar && similarFacts.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {similarFacts.map((f) => (
                                    <li
                                        key={f.id}
                                        onClick={() => handleFactClick(f)}
                                        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    >
                                        <span className="text-gray-700">• {f.fact}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
