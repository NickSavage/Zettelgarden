import { File } from "./File";
import { Tag } from "./Tags";

// src/models/PartialCard.ts
export interface PartialCard {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  parent_id: number;
  created_at: string;
  updated_at: string;
  is_literature_card: boolean;
  tags: Tag[];
  is_flashcard: boolean;
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
  is_literature_card: boolean;
  tags: Tag[];
  is_flashcard: boolean;
}

export const defaultPartialCard: PartialCard = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  parent_id: -1,
  created_at: "",
  updated_at: "",
  is_literature_card: false,
  tags: [],
  is_flashcard: false,
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
  is_literature_card: false,
  tags: [],
  is_flashcard: false,
};

export interface NextIdResponse {
  error: boolean;
  message: string;
  new_id: string;
}

export interface FlashcardRecordNextParams {
  card_pk: number;
  rating: number;
}
enum Rating {
  Again = 0,
  Hard = 1,
  Good = 2,
  Easy = 3
}

export function getRatingValue(rating: string): number {
  switch (rating.toLowerCase()) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
    default:
      throw new Error(`Invalid rating value: ${rating}`);
  }
}
