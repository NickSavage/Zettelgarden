import { checkStatus } from "./common";
const base_url = import.meta.env.VITE_URL;

export function getBillingPortalUrl(): Promise<{ url: string }> {
  let token = localStorage.getItem("token");
  const url = `${base_url}/billing/portal`;
  return fetch(url, {
    method: "GET", // Specify the method
    headers: {
      Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
    },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<{ url: string }>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    })
    .catch((error) => {
      console.error("Error fetching user subscription:", error);
      throw error;
    });
}
