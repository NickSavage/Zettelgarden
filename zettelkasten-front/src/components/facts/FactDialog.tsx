import React from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";
import { FactWithCard } from "../../models/Fact";
import { CardTag } from "../cards/CardTag";
import { Button } from "../Button";

interface FactDialogProps {
    fact: FactWithCard | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FactDialog({ fact, isOpen, onClose }: FactDialogProps) {
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

                    <div className="mt-6 flex justify-end">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
