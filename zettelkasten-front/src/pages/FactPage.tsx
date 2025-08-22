import React, { useState, useEffect } from "react";
import { FactWithCard } from "../models/Fact";
import { Link } from "react-router-dom";
import { CardIcon } from "../assets/icons/CardIcon";
import { getAllFacts } from "../api/facts";
import { HeaderSection } from "../components/Header";

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

    return (
        <div className="p-4">
            <HeaderSection text="Facts" />

            <div className="mb-4 flex gap-2 items-center">
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
                    {currentFacts.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-800">{f.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">
                                {f.fact}
                                {f.card && (
                                    <>
                                        <span className="ml-2 text-gray-400">→</span>
                                        <Link
                                            to={`/app/card/${f.card.id}`}
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
                    ))}
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
        </div>
    );
}
