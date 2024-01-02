// API
const base_url = process.env.REACT_APP_URL;

function checkStatus(response) {
  console.log(response);
  if (response.status === 401 || response.status === 422) {
    localStorage.removeItem("token");
    return;
  }
  // If the response is ok, return the response to continue the promise chain
  if (response.ok) {
    return response;
  }
  // If the response is not ok and not 401, throw an error
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
      let results = response.json();
      return results;
    });
}
export function fetchPartialCards(searchTerm = "") {
  let token = localStorage.getItem("token");
  let url = base_url + "/cards?partial=true";
  if (searchTerm) {
    url += `&search_term=${encodeURIComponent(searchTerm)}`;
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
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
    .then(checkStatus)
    .then((cardData) => {
      console.log(cardData);
      // Process the card data here (if needed) and return it
      return cardData.json();
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
  })
    .then(checkStatus)
    .then((response) => response.json());
}

export function getUser(id) {
  let encoded = encodeURIComponent(id);
  const url = base_url + `/users/${encoded}`;
  let token = localStorage.getItem("token");

  // Send a GET request to the URL
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(checkStatus)
    .then((userData) => {
      // Process the card data here (if needed) and return it
      return userData;
    });
}

export function changePassword(id, password) {
  let encoded = encodeURIComponent(id);
  const url = base_url + `/user/${encoded}/password`;
  let token = localStorage.getItem("token");

  return fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: password }),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
}

export function uploadFile(file, card_pk) {
  let token = localStorage.getItem("token");
  const url = base_url + "/files/upload";

  // Create a FormData object and append the file
  let formData = new FormData();
  formData.append("file", file);
  formData.append("card_pk", card_pk); // Append card_pk to the form data

  // Send a POST request with the FormData
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set 'Content-Type' for FormData, as the browser sets it with the correct boundary
    },
    body: formData,
  })
    .then(checkStatus)
    .then((response) => response.json());
}

export function renderFile(fileId) {
  let token = localStorage.getItem("token");
  const url = `${base_url}/files/download/${fileId}`;

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) return response.blob();
      throw new Error("Network response was not ok.");
    })
    .then((blob) => {
      // Create a local URL for the blob object
      const localUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor tag to trigger the download
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = ""; // Optional: Provide a default download name for the file
      document.body.appendChild(a);
      a.click();

      // Clean up by revoking the object URL and removing the temporary anchor tag
      window.URL.revokeObjectURL(localUrl);
      a.remove();
    })
    .catch((error) => console.error("Download error:", error));
}

export function downloadFile(fileId) {
  let token = localStorage.getItem("token");
  const url = `${base_url}/files/download/${fileId}`;

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) return response.blob();
      throw new Error("Network response was not ok.");
    })
    .then((blob) => {
      return window.URL.createObjectURL(blob);
    })
    .catch((error) => console.error("Download error:", error));
}

export function getAllFiles() {
  let token = localStorage.getItem("token");
  const url = `${base_url}/files`;

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(checkStatus)
    .then((response) => {
      let results = response.json();
      return results;
    });
}
