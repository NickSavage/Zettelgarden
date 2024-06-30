import { ResetPasswordResponse } from "../models/Auth";
import { GenericResponse } from "../models/common";
import { LoginResponse } from "../models/Auth";
import { checkStatus } from "./common";
const base_url = process.env.REACT_APP_URL;

export function login(email: string, password: string): Promise<LoginResponse> {
  return fetch(base_url + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<LoginResponse>;
      } else {
        return Promise.reject(new Error("something has gone wrong"));
      }
    });
}

export function requestPasswordReset(email: string): Promise<GenericResponse> {
  const url = `${base_url}/request-reset`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<GenericResponse>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function resetPassword(
  token: string,
  new_password: string,
): Promise<ResetPasswordResponse> {
  const url = `${base_url}/reset-password`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password }),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<ResetPasswordResponse>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
