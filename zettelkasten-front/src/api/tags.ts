import { Tag } from "../models/Tags";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export function fetchUserTags(): Promise<Tag[]> {
  
  const url = base_url + `/tags`;

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

export function deleteTag(id: number): Promise<Tag | null> {
  let encodedId = encodeURIComponent(id);
  const url = `${base_url}/tags/id/${encodedId}`;

  let token = localStorage.getItem("token");

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
        return response.json() as Promise<Tag>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

interface CreateTagParams {
  name: string;
  color: string;
}

export function createTag(params: CreateTagParams): Promise<Tag> {
  const url = base_url + `/tags`;
  let token = localStorage.getItem("token");

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<Tag>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
