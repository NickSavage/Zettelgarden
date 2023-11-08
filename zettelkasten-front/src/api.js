import { useAuth } from "./AuthContext";
// API
const base_url = process.env.REACT_APP_URL;
const username = process.env.REACT_APP_USERNAME;
const password = process.env.REACT_APP_PASSWORD;
const creds = btoa(`${username}:${password}`);

export function fetchCards() {
  let token = localStorage.getItem("token");
  return fetch(base_url + "/cards", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => {
    let results = response.json();
    return results;
  });
}

export function getCard(id) {
  // Assuming your backend is running on the same IP and port as in previous example
  let encoded = encodeURIComponent(id);
  const url = base_url + `/cards/${encoded}`;

  let token = localStorage.getItem("token");
  // Send a GET request to the URL
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => {
      // Check if the response is successful (status code in the range 200-299)
      if (response.ok) {
        // Parse and return the JSON response
        return response.json();
      } else {
        // Throw an error if the response is not successful
        throw new Error("Failed to fetch card");
      }
    })
    .then((cardData) => {
      // Process the card data here (if needed) and return it
      return cardData;
    });
}
export function saveNewCard(card) {
  const url = base_url + `/cards`;
  const method = "POST";
  return saveCard(url, method, card);
}

export function saveExistingCard(card) {
  const url = base_url + `/cards/${encodeURIComponent(card.id)}`;
  const method = "PUT";
  return saveCard(url, method, card);
}
export function saveCard(url, method, card) {
  let token = localStorage.getItem("token");
  return fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  }).then((response) => response.json());
}

export function getUser(id) {
  let encoded = encodeURIComponent(id);
  const url = base_url + `/users/${encoded}`;
  let token = localStorage.getItem("token");

  // Send a GET request to the URL
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => {
      // Check if the response is successful (status code in the range 200-299)
      if (response.ok) {
        // Parse and return the JSON response
        return response.json();
      } else {
        // Throw an error if the response is not successful
        throw new Error("Failed to fetch user");
      }
    })
    .then((userData) => {
      // Process the card data here (if needed) and return it
      return userData;
    });
}
