// API
const base_url = process.env.REACT_APP_URL;

function checkStatus(response) {
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

export function checkLogin() {
  let token = localStorage.getItem("token");
  return fetch("/auth", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => {
    if (response.status === 200) {
      return true;
    } else {
      console.log("asdsa");
      return false;
    }
  });
}

export function createUser(userData) {
  let token = localStorage.getItem("token");
  return fetch(base_url + "/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then(checkStatus)
    .then((response) => response.json());
}

export function getUsers() {
  const url = base_url + `/users`;
  let token = localStorage.getItem("token");

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(checkStatus)
    .then((response) => {
      return response.json();
    });
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
      return userData.json();
    });
}

export function getCurrentUser() {
  const url = base_url + `/current`;
  let token = localStorage.getItem("token");

  // Send a GET request to the URL
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(checkStatus)
    .then((userData) => {
      // Process the card data here (if needed) and return it
      return userData.json();
    });
}

export async function checkAdmin() {
  let url = `${base_url}/admin`;
  let token = localStorage.getItem("token");
  let response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204) {
    return true;
  } else {
    return false;
  }
}

export function requestPasswordReset(email) {
  const url = `${base_url}/request-reset`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then(checkStatus)
    .then((response) => response.json());
}

export function resetPassword(token, new_password) {
  const url = `${base_url}/reset-password`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password }),
  })
    .then(checkStatus)
    .then((response) => response.json());
}
export async function editUser(userId, updateData) {
  let token = localStorage.getItem("token");
  const url = `${base_url}/users/${userId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function validateEmail(token) {
  const url = `${base_url}/email-validate`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })
    .then(checkStatus)
    .then((response) => response.json());
}
export async function resendValidateEmail() {
  let token = localStorage.getItem("token");
  const url = `${base_url}/email-validate`;

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(checkStatus)
    .then((response) => response.json()["message"]);
}
export function getUserSubscription(id) {
  let encodedId = encodeURIComponent(id);
  const url = `${base_url}/users/${encodedId}/subscription`;
  let token = localStorage.getItem("token");

  // Send a GET request to the URL
  return fetch(url, {
    method: 'GET', // Specify the method
    headers: {
      Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
    },
  })
  .then(checkStatus)
  .then(response => response.json()) // Parse the JSON response
  .catch(error => {
    // Handle any errors here
    console.error('Error fetching user subscription:', error);
    throw error;
  });
}
export async function createCheckoutSession(interval) {
  let token = localStorage.getItem("token"); // Retrieve the JWT token from local storage

  // Define the API endpoint
  const url = `${base_url}/billing/create_checkout_session`;

  try {
    // Send a GET request to the server
    const response = await fetch(url, {
      method: 'POST', // Specify the method
      headers: {
        Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
	  "Content-Type": "application/json",
      },
	body: JSON.stringify({ interval: interval }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to create checkout session. Please try again.');
    }

      return response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    // Handle errors, such as by showing a message to the user
  }
}
// Add this function to your API functions file
export async function getSuccessfulSessionData(sessionId) {
  let token = localStorage.getItem("token"); // Retrieve the JWT token from local storage

  // Define the API endpoint
  const url = `${base_url}/billing/success?session_id=${sessionId}`;

  try {
    const response = await fetch(url, {
      method: 'GET', // Specify the method
      headers: {
        Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
      },
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to retrieve session data. Please try again.');
    }

    return response.json();
  } catch (error) {
    console.error('Error retrieving session data:', error);
    // Handle errors, such as by showing a message to the user
  }
}
