// API for fetching facts
// API for fetching facts
// API for fetching facts
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { Fact, FactWithCard } from "../models/Fact";
import { PartialCard } from "../models/Card";

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

export async function getFactCards(factId: number): Promise<PartialCard[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${base_url}/facts/${factId}/cards`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch fact cards");
  }
  return res.json();
}

export async function mergeFacts(fact1Id: number, fact2Id: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${base_url}/facts/merge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fact1_id: fact1Id, fact2_id: fact2Id }),
  });
  if (!res.ok) {
    throw new Error("Failed to merge facts");
  }
}

export async function getSimilarFacts(factId: number, limit = 10): Promise<FactWithCard[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${base_url}/facts/${factId}/similar?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch similar facts");
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
