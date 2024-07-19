import { checkStatus } from "./common";
import {
  File,
  EditFileMetadataParams,
  UploadFileResponse,
} from "../models/File";
import { GenericResponse } from "../models/common";

const base_url = import.meta.env.VITE_URL;

export function uploadFile(
  file: Blob,
  card_pk: number,
): Promise<UploadFileResponse> {
  let token = localStorage.getItem("token");
  const url = base_url + "/files/upload";

  const maxSize = 10 * 1024 * 1024; // 10 MB in bytes
  if (file.size > maxSize) {
    return Promise.reject(
      new Error("File size exceeds the maximum limit of 10 MB."),
    );
  }

  // Create a FormData object and append the file
  let formData = new FormData();
  formData.append("file", file);
  formData.append("card_pk", card_pk.toString()); // Append card_pk to the form data

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
    .then((response) => {
      if (response) {
        return response.json() as Promise<UploadFileResponse>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function renderFile(fileId: number, filename: string) {
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
      a.download = filename || "downloaded_file";
      document.body.appendChild(a);
      a.click();

      // Clean up by revoking the object URL and removing the temporary anchor tag
      window.URL.revokeObjectURL(localUrl);
      a.remove();
    })
    .catch((error) => console.error("Download error:", error));
}

export function downloadFile(fileId: string) {
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

export function getAllFiles(): Promise<File[]> {
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
      if (response && response.status !== 204) {
        return response.json() as Promise<File[]>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function deleteFile(fileId: number): Promise<GenericResponse> {
  let token = localStorage.getItem("token");
  const url = `${base_url}/files/${fileId}`;

  return fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
export function editFile(
  fileId: string,
  updateData: EditFileMetadataParams,
): Promise<File> {
  let token = localStorage.getItem("token");
  const url = `${base_url}/files/${fileId}`;

  return fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json() as Promise<File>;
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}
