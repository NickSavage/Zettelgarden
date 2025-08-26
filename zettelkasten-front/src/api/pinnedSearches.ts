import { PinnedSearch, SearchConfig } from "../models/PinnedSearch";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

/**
 * Save a search configuration to pinned searches
 * @param title The title for the pinned search
 * @param searchTerm The search term
 * @param searchConfig The search configuration options
 * @returns A promise that resolves when the search is pinned
 */
export function pinSearch(
    title: string,
    searchTerm: string,
    searchConfig: SearchConfig
): Promise<void> {
    const url = `${base_url}/searches/pin`;
    let token = localStorage.getItem("token");

    return fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            search_term: searchTerm,
            search_config: searchConfig
        }),
    })
        .then(checkStatus)
        .then(() => {
            return;
        });
}

/**
 * Remove a pinned search
 * @param id The ID of the pinned search to remove
 * @returns A promise that resolves when the search is unpinned
 */
export function unpinSearch(id: number): Promise<void> {
    const url = `${base_url}/searches/pin/${id}`;
    let token = localStorage.getItem("token");

    return fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    })
        .then(checkStatus)
        .then(() => {
            return;
        });
}

/**
 * Get all pinned searches for the current user
 * @returns A promise that resolves to an array of pinned searches
 */
export function getPinnedSearches(): Promise<PinnedSearch[]> {
    const url = `${base_url}/searches/pinned`;
    let token = localStorage.getItem("token");

    return fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })
        .then(checkStatus)
        .then((response) => {
            if (response) {
                return response.json().then((pinnedSearches: any[]) => {
                    if (pinnedSearches === null) {
                        return [];
                    }

                    // Transform the response into PinnedSearch objects
                    return pinnedSearches.map((pinnedSearch) => {
                        return {
                            ...pinnedSearch,
                            created_at: new Date(pinnedSearch.created_at),
                        };
                    });
                });
            } else {
                return Promise.reject(new Error("Response is undefined"));
            }
        });
}
