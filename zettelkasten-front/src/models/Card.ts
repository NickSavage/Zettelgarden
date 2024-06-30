import { File } from "./File";

// src/models/PartialCard.ts
export interface PartialCard {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  body: string;
  link: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  parent: PartialCard;
  files: File[];
  children: PartialCard[];
  references: PartialCard[];
}

export const defaultPartialCard: PartialCard = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  created_at: "",
  updated_at: "",
};

export const defaultCard: Card = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  body: "",
  link: "",
  is_deleted: false,
  created_at: "",
  updated_at: "",
  parent: defaultPartialCard,
  files: [],
  children: [],
  references: [],
};

export interface NextIdResponse {
  error: boolean;
  message: string;
  new_id: string;
}
