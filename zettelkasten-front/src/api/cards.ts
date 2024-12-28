import {
  Card,
  CardChunk,
  PartialCard,
  NextIdResponse,
  FlashcardRecordNextParams,
  getRatingValue,
  Entity,
  SearchResult,
} from "../models/Card";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export function semanticSearchCards(searchTerm = "", useClassicSearch = false): Promise<SearchResult[]> {
  let token = localStorage.getItem("token");
  let url = base_url + "/search";
  const params = new URLSearchParams();
  
  if (searchTerm) {
    params.append("search_term", searchTerm);
  }
  if (useClassicSearch) {
    params.append("type", "classic");
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((results: SearchResult[]) => {
          if (results === null) {
            return [];
          }
          return results.map((result) => ({
            ...result,
            created_at: new Date(result.created_at),
            updated_at: new Date(result.updated_at),
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function fetchCards(searchTerm = ""): Promise<Card[]> {
  return semanticSearchCards(searchTerm, true).then((results) => {
    // Convert SearchResults back to Cards for backward compatibility
    return results.map((result) => ({
      id: parseInt(result.id),
      card_id: result.id,
      title: result.title,
      body: result.preview,
      created_at: result.created_at,
      updated_at: result.updated_at,
      parent_id: result.metadata?.parent_id,
      // Add other required Card fields with defaults
      user_id: 0, // This will be filled by the backend
      link: "",
      is_deleted: false,
      files: [],
      children: [],
      references: [],
      keywords: [],
      tags: [],
      tasks: [],
      entities: [],
    }));
  });
}

export function fetchPartialCards(
  searchTerm = "",
  sortMethod = "",
): Promise<PartialCard[]> {
  let token = localStorage.getItem("token");
  let url = base_url + "/cards?partial=true";
  if (searchTerm) {
    url += `&search_term=${encodeURIComponent(searchTerm)}`;
  }
  if (sortMethod) {
    url += `&sort_method=${encodeURIComponent(sortMethod)}`;
  }

  console.log(url);
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((cards: PartialCard[]) => {
          if (cards === null) {
            return [];
          }
          let results = cards.map((card) => ({
            ...card,
            created_at: new Date(card.created_at),
            updated_at: new Date(card.updated_at),
          }));
          return results;
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function fetchRelatedCards(id: string): Promise<CardChunk[]> {
  let token = localStorage.getItem("token");

  const url = base_url + `/cards/${id}/related`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((cards: CardChunk[]) => {
          if (cards === null) {
            return [];
          }
          let results = cards.map((card) => ({
            ...card,
            created_at: new Date(card.created_at),
            updated_at: new Date(card.updated_at),
          }));
          return results;
        });
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
        return response.json().then((card: Card) => {
          let children =
            card.children !== null
              ? card.children.map((child) => {
                return {
                  ...child,
                  created_at: new Date(child.created_at),
                  updated_at: new Date(child.updated_at),
                };
              })
              : [];
          let references =
            card.references !== null
              ? card.references.map((ref) => {
                return {
                  ...ref,
                  created_at: new Date(ref.created_at),
                  updated_at: new Date(ref.updated_at),
                };
              })
              : [];
          let tasks =
            card.tasks !== null
              ? card.tasks.map((task) => {
                return {
                  ...task,
                  scheduled_date: task.scheduled_date
                    ? new Date(task.scheduled_date)
                    : null,
                  dueDate: task.dueDate ? new Date(task.dueDate) : null,
                  created_at: new Date(task.created_at),
                  updated_at: new Date(task.updated_at),
                  completed_at: task.completed_at
                    ? new Date(task.completed_at)
                    : null,
                };
              })
              : [];
          return {
            ...card,
            created_at: new Date(card.created_at),
            updated_at: new Date(card.updated_at),
            children: children,
            references: references,
            tasks: tasks,
          };
        });
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

export function postNextFlashcard(
  card_pk: number,
  rating: string,
): Promise<Card> {
  let ratingInt = getRatingValue(rating);

  const data: FlashcardRecordNextParams = {
    card_pk: card_pk,
    rating: ratingInt,
  };
  console.log(data);

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
export async function getNextRootId(): Promise<NextIdResponse> {
  const url = `${base_url}/cards/next-root-id`;
  let token = localStorage.getItem("token");

  return await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
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
