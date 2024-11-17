import { ParseResult } from "../models/Reference";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;
export function parseURL(url: string): Promise<ParseResult> {
  const token = localStorage.getItem("token");
  const parseUrl = base_url + "/url/parse";

  return fetch(parseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((result: ParseResult) => {
          return result;
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
