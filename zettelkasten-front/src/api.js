// API
import { checkStatus } from "./api/common";
const base_url = process.env.REACT_APP_URL;

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
