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

export function fetchCards(searchTerm = ""): Promise<Card[]> {
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

export function fetchPartialCards(searchTerm = "", sortMethod = "", inactive = false): Promise<PartialCard[]> {
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

export function getCard(id: number): Promise<Card> {
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
}

export function saveNewCard(card: Card): Promise<Card> {
  const url = base_url + `/cards`;
  const method = "POST";
  return saveCard(url, method, card);
}

export function saveExistingCard(card: Card): Promise<Card> {
  const url = base_url + `/cards/${encodeURIComponent(card.id)}`;
  const method = "PUT";
  return saveCard(url, method, card);
}
export function saveCard(url: string, method: string, card: Card): Promise<Card> {
  let token = localStorage.getItem("token");
  return fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<Card>;
      } else {
            return Promise.reject(new Error("Response is undefined"));
      }
    })
}

export function deleteCard(id: number): Promise<Card|null> {
  let encodedId = encodeURIComponent(id);
  const url = `${base_url}/cards/${encodedId}`;

  let token = localStorage.getItem("token");

  // Send a DELETE request to the URL
  return fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {

      if (response) {
        if (response.status === 204) {
          return null;
        }
        return response.json() as Promise<Card>;
      } else {
            return Promise.reject(new Error("Response is undefined"));
      }
    });
}