import React, { useState, useEffect } from "react";
import { FactWithCard } from "../models/Fact";
import { Link } from "react-router-dom";
import { CardIcon } from "../assets/icons/CardIcon";
import { getAllFacts, mergeFacts } from "../api/facts";
import { Dialog } from "@headlessui/react";
import { HeaderSection } from "../components/Header";
import { useShortcutContext } from "../contexts/ShortcutContext";

export function FactPage() {
    const [facts, setFacts] = useState<FactWithCard[]>([]);
    const [filteredFacts, setFilteredFacts] = useState<FactWithCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterText, setFilterText] = useState("");
    const [sortBy, setSortBy] = useState<"created_at" | "fact">("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [selectedFacts, setSelectedFacts] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);

    const { setSelectedFact, setShowFactDialog, setSelectedEntity, setShowEntityDialog } = useShortcutContext();

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    const handleMergeClick = () => {
        if (selectedFacts.length < 2) return;
        setShowConfirmDialog(true);
    };

    const handleConfirmMerge = async () => {
        if (selectedFacts.length < 2) return;
        setShowConfirmDialog(false);
        setIsMerging(true);
        const baseFact = selectedFacts[0];

        try {
            // Merge all other facts into the first one
            for (let i = 1; i < selectedFacts.length; i++) {
                await mergeFacts(baseFact, selectedFacts[i]);
            }
            setSelectedFacts([]);
            // reload all facts
            const data = await getAllFacts();
            const enrichedData = data.map((f: any) => ({
                ...f,
                card: f.card ?? null,
            })) as FactWithCard[];
            setFacts(enrichedData);
            setFilteredFacts(enrichedData);
        } catch (err) {
            setError("Failed to merge facts");
            console.error("Error merging facts:", err);
        } finally {
            setIsMerging(false);
        }
    };

    useEffect(() => {
        getAllFacts()
            .then((data) => {
                // Cast plain Fact[] to FactWithCard[] (backend may not always attach a card)
                const enrichedData = data.map((f: any) => ({
                    ...f,
                    card: f.card ?? null,
                })) as FactWithCard[];
                setFacts(enrichedData);
                setFilteredFacts(enrichedData);
                setLoading(false);
            })
            .catch((err) => {
                setError("Failed to load facts");
                setLoading(false);
                console.error(err);
            });
    }, []);

    useEffect(() => {
        const search = filterText.toLowerCase();
        setFilteredFacts(
            facts.filter(
                (f) =>
                    f.fact.toLowerCase().includes(search)
            )
        );
        setCurrentPage(1);
    }, [filterText, facts]);

    const sortedFacts = [...filteredFacts].sort((a, b) => {
        if (sortBy === "fact") {
            return sortDirection === "asc"
                ? a.fact.localeCompare(b.fact)
                : b.fact.localeCompare(a.fact);
        } else {
            const aDate = new Date(a.created_at).getTime();
            const bDate = new Date(b.created_at).getTime();
            return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        }
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentFacts = sortedFacts.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredFacts.length / itemsPerPage);

    if (loading) return <div className="p-4">Loading facts...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    const handleFactClick = (fact: FactWithCard, event: React.MouseEvent) => {
        if (selectionMode || event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setSelectedFacts((prev) => {
                const idx = prev.indexOf(fact.id);
                if (idx !== -1) {
                    return prev.filter((id) => id !== fact.id);
                } else {
                    return [...prev, fact.id];
                }
            });
        } else {
            setSelectedFact(fact);
            setShowFactDialog(true);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        if (selectionMode) setSelectedFacts([]);
    };

    return (
        <div className="p-4">
            <HeaderSection text="Facts" />

            <div className="mb-4 flex gap-2 items-center">
                <button
                    onClick={toggleSelectionMode}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectionMode
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    {selectionMode ? "Exit Selection" : "Select Mode"}
                </button>
                {selectionMode && selectedFacts.length > 0 && (
                    <span className="text-sm text-gray-600">
                        {selectedFacts.length} selected
                    </span>
                )}
                {selectionMode && selectedFacts.length > 1 && (
                    <button
                        onClick={handleMergeClick}
                        disabled={isMerging}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                    >
                        {isMerging ? "Merging..." : "Merge Selected"}
                    </button>
                )}
                <input
                    type="text"
                    placeholder="Filter facts..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="px-3 py-2 border rounded w-64"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded"
                >
                    <option value="created_at">Sort by Created</option>
                    <option value="fact">Sort by Text</option>
                </select>
                <button
                    onClick={() =>
                        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 border rounded"
                >
                    {sortDirection === "asc" ? "↑" : "↓"}
                </button>
            </div>

            <table className="min-w-full border divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {selectionMode && (
                            <th className="px-4 py-2">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedFacts.length === currentFacts.length &&
                                        currentFacts.length > 0
                                    }
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedFacts(currentFacts.map((f) => f.id));
                                        } else {
                                            setSelectedFacts([]);
                                        }
                                    }}
                                />
                            </th>
                        )}
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            ID
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Fact
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Created At
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {currentFacts.map((f) => {
                        const isSelected = selectedFacts.includes(f.id);
                        return (
                            <tr
                                key={f.id}
                                className={`hover:bg-gray-50 ${isSelected ? "bg-blue-100" : ""
                                    }`}
                                onClick={(e) => handleFactClick(f, e)}
                            >
                                {selectionMode && (
                                    <td className="px-4 py-2">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleFactClick(f, e as any);
                                            }}
                                        />
                                    </td>
                                )}
                                <td className="px-4 py-2 text-sm text-gray-800">{f.id}</td>
                                <td className="px-4 py-2 text-sm text-gray-800 cursor-pointer hover:underline">
                                    {f.fact}
                                    {f.card && (
                                        <>
                                            <span className="ml-2 text-gray-400">→</span>
                                            <Link
                                                to={`/app/card/${f.card.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                <div className="w-3 h-3 mr-1 text-gray-400">
                                                    <CardIcon />
                                                </div>
                                                [{f.card.card_id}] {f.card.title}
                                            </Link>
                                        </>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-800">
                                    {new Date(f.created_at).toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {filteredFacts.length === 0 && (
                <div className="text-center text-gray-500 mt-8">No facts found</div>
            )}

            {filteredFacts.length > 0 && (
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="flex items-center">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
            {showConfirmDialog && (
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
                                Primary Fact (will be kept):
                                <br />
                                {facts.find(f => f.id === selectedFacts[0])?.fact}
                            </p>
                            <p className="text-gray-600 mb-2">
                                The following facts will be merged into the primary:
                            </p>
                            <ul className="list-disc pl-5">
                                {selectedFacts.slice(1).map(id => {
                                    const fact = facts.find(f => f.id === id);
                                    return fact ? (
                                        <li key={id} className="text-gray-700">
                                            {fact.fact}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        </div>
                        <p className="text-red-600 text-sm mb-4">
                            This action cannot be undone. The merged facts will be deleted.
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
        </div>
    );
}
