import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export interface SummarizeJobResponse {
    id: number;
    status: string;
    result?: string;
}

export function createSummarization(text: string): Promise<SummarizeJobResponse> {
    let token = localStorage.getItem("token");
    return fetch(base_url + "/summarize", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    })
        .then(checkStatus)
        .then((response) => {
            if (response) {
                return response.json() as Promise<SummarizeJobResponse>;
            } else {
                return Promise.reject(new Error("Response is undefined"));
            }
        });
}

export function fetchSummarization(id: number): Promise<SummarizeJobResponse> {
    let token = localStorage.getItem("token");
    return fetch(`${base_url}/summarize/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
        .then(checkStatus)
        .then((response) => {
            if (response) {
                return response.json() as Promise<SummarizeJobResponse>;
            } else {
                return Promise.reject(new Error("Response is undefined"));
            }
        });
}
