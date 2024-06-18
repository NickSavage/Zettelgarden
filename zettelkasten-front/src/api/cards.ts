import { Card, PartialCard } from "../models/Card";

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

export function fetchPartialCards(searchTerm = "", sortMethod = "", inactive = false) {
  console.log([searchTerm, sortMethod, inactive])
  let token = localStorage.getItem("token");
  let url = base_url + "/cards?partial=true";
  if (searchTerm) {
    url += `&search_term=${encodeURIComponent(searchTerm)}`;
  }
  if (sortMethod) {
    url += `&sort_method=${encodeURIComponent(sortMethod)}`;
  }
  if (inactive) {
    url += `&inactive=${encodeURIComponent(inactive)}`;
  }

  console.log(url)
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
        if (response) {
            return response.json() as Promise<PartialCard[]>;
          } else {
            return Promise.reject(new Error("Response is undefined"));
          }
    });
}

export function getCard(id: number) {
  // Assuming your backend is running on the same IP and port as in previous example
  let encoded = encodeURIComponent(id);
  const url = base_url + `/cards/${encoded}`;

  let token = localStorage.getItem("token");
  // Send a GET request to the URL
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<Card>;
      } else {
            return Promise.reject(new Error("Response is undefined"));
      }
    })
    .catch((error) => {
      return { error: error };
    });
}