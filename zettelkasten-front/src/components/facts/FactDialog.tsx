import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";
import { FactWithCard } from "../../models/Fact";
import { CardTag } from "../cards/CardTag";
import { Button } from "../Button";
import { Entity } from "../../models/Card";
import { getFactEntities } from "../../api/entities";

interface FactDialogProps {
    fact: FactWithCard | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FactDialog({ fact, isOpen, onClose }: FactDialogProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (fact) {
            setLoading(true);
            setError(null);
            getFactEntities(fact.id)
                .then(setEntities)
                .catch(() => setError("Failed to load entities"))
                .finally(() => setLoading(false));
        } else {
            setEntities([]);
        }
    }, [fact]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        Fact Details
                    </Dialog.Title>

                    {fact ? (
                        <div className="space-y-3 text-sm text-gray-700">
                            <p>{fact.fact}</p>
                            {fact.card && (
                                <div>
                                    <span className="text-xs text-gray-600">Linked Card: </span>
                                    <Link
                                        to={`/app/card/${fact.card.id}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <CardTag card={fact.card} showTitle={true} />
                                    </Link>
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                <p>ID: {fact.id}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No fact selected.</p>
                    )}

                    <h4 className="text-md font-medium text-gray-800 mt-4">Linked Entities:</h4>
                    {loading && <p>Loading entities...</p>}
                    {error && <p className="text-red-600">{error}</p>}
                    {!loading && entities.length === 0 && <p>No entities linked.</p>}
                    {!loading && entities.length > 0 && (
                        <ul className="space-y-1 text-sm">
                            {entities.map((e) => (
                                <li key={e.id}>
                                    <Link to={`/app/entity/${e.id}`} className="text-blue-600 hover:underline">
                                        {e.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
