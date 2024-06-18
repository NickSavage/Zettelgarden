import { Card } from "../models/Card";

const base_url = process.env.REACT_APP_URL;

function checkStatus(response: Response) {
  if (response.status === 401 || response.status === 422) {
    localStorage.removeItem("token");
    return;
  }
  // If the response is ok, return the response to continue the promise chain
  if (response.ok) {
    return response;
  }
  throw new Error(`Request failed with status: ${response.status}`);
}

export function fetchCards(searchTerm = "") {
  let token = localStorage.getItem("token");
  let url = base_url + "/cards";
  if (searchTerm) {
    url += `?search_term=${encodeURIComponent(searchTerm)}`;
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
        if (response) {
            return response.json() as Promise<Card[]>;
          } else {
            return Promise.reject(new Error("Response is undefined"));
          }
    });
}