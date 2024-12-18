import { Entity } from "../models/Card";
import { checkStatus } from "./common";

const base_url = import.meta.env.VITE_URL;

export function fetchEntities(): Promise<Entity[]> {
  let token = localStorage.getItem("token");
  const url = base_url + "/entities";

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(checkStatus)
    .then((response) => {
      if (response) {
        return response.json().then((entities: Entity[]) => {
          if (entities === null) {
            return [];
          }
          return entities.map((entity) => ({
            ...entity,
            created_at: new Date(entity.created_at),
            updated_at: new Date(entity.updated_at),
          }));
        });
      } else {
        return Promise.reject(new Error("Response is undefined"));
      }
    });
}

export function mergeEntities(entity1Id: number, entity2Id: number): Promise<void> {
  let token = localStorage.getItem("token");
  const url = base_url + "/entities/merge";

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entity1_id: entity1Id,
      entity2_id: entity2Id,
    }),
  })
    .then(checkStatus)
    .then((response) => {
      if (!response) {
        return Promise.reject(new Error("Response is undefined"));
      }
      return;
    });
} 