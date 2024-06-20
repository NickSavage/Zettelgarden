import { ResetPasswordResponse } from "../models/Auth";
import { GenericResponse } from "../models/common";
import { checkStatus } from "./common";
const base_url = process.env.REACT_APP_URL;

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

export function resetPassword(token: string, new_password: string): Promise<ResetPasswordResponse> {
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
