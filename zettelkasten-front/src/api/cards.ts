import {
  Card,
  PartialCard,
  NextIdResponse,
  FlashcardRecordNextParams,
  getRatingValue,
} from "../models/Card";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

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

export function fetchPartialCards(
  searchTerm = "",
  sortMethod = "",
  inactive = false,
): Promise<PartialCard[]> {
  console.log([searchTerm, sortMethod, inactive]);
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

  console.log(url);
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

export function getCard(id: string): Promise<Card> {
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
    });
}

export function getNextFlashcard(): Promise<Card> {
  // Assuming your backend is running on the same IP and port as in previous example
  const url = base_url + `/flashcards`;

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
    });
}

export function postNextFlashcard(card_pk: number, rating: string): Promise<Card> {
  let ratingInt = getRatingValue(rating);

  const data: FlashcardRecordNextParams = { card_pk: card_pk, rating: ratingInt };
  console.log(data)

  let token = localStorage.getItem("token");
  return fetch(base_url + `/flashcards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<Card>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
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
export function saveCard(
  url: string,
  method: string,
  card: Card,
): Promise<Card> {
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
    });
}

export function deleteCard(id: number): Promise<Card | null> {
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
export async function getNextId(cardType: string): Promise<NextIdResponse> {
  const url = `${base_url}/cards/next`;

  let token = localStorage.getItem("token");

  return await fetch(url, {
    method: "POST",
    body: JSON.stringify({ card_type: cardType }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<NextIdResponse>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
