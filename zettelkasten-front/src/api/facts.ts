// API for fetching facts
// API for fetching facts
// API for fetching facts
import { Fact } from "../models/Fact";

const base_url = import.meta.env.VITE_URL;

export async function getAllFacts(): Promise<Fact[]> {
  let token = localStorage.getItem("token");
  const res = await fetch(`${base_url}/facts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch facts");
  }
  return res.json();
}

export async function getCardFacts(cardId: number): Promise<Fact[]> {
  let token = localStorage.getItem("token");
  const res = await fetch(`${base_url}/cards/${cardId}/facts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch facts");
  }
  return res.json();
}
