import { File } from "./File";

// src/models/PartialCard.ts
export interface PartialCard {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  parent_id: number;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: number;
  card_pk: number;
  user_id: number;
  keyword: string;
  
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
  parent_id: number;
  parent: PartialCard;
  files: File[];
  children: PartialCard[];
  references: PartialCard[];
  keywords: Keyword[];
}

export const defaultPartialCard: PartialCard = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  parent_id: -1,
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
  parent_id: -1,
  parent: defaultPartialCard,
  files: [],
  children: [],
  references: [],
  keywords: [],
};

export interface NextIdResponse {
  error: boolean;
  message: string;
  new_id: string;
}
