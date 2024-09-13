import { Tag } from "../models/Tags";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export function fetchUserTags(): Promise<Tag[]> {
  
  const url = base_url + `/tags/card`;

  let token = localStorage.getItem("token");

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<Tag[]>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
