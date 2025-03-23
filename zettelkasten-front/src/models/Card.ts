import { File } from "./File";
import { Tag } from "./Tags";
import { Task } from "./Task";

export interface PartialCard {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  parent_id: number;
  created_at: Date;
  updated_at: Date;
  tags: Tag[];
}

export interface Entity {
  id: number;
  user_id: number;
  name: string;
  description: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  card_count: number;
  card_pk: number | null;
  card?: PartialCard;
}

export interface Card {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  body: string;
  link: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  parent_id: number;
  parent: PartialCard;
  files: File[];
  children: PartialCard[];
  references: PartialCard[];
  tags: Tag[];
  tasks: Task[];
  entities: Entity[];
  is_pinned?: boolean; // Whether the current user has pinned this card
}

export interface CardChunk {
  id: number;
  card_id: string;
  user_id: number;
  title: string;
  body: string;
  parent_id: number;
  created_at: Date;
  updated_at: Date;
  tags: Tag[];
  ranking: number;
  combined_score: number;
  shared_entities: number;
  entity_similarity: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  preview: string;
  score: number;
  created_at: Date;
  updated_at: Date;
  metadata: {
    parent_id?: number;
    shared_entities?: number;
    entity_similarity?: number;
    semantic_ranking?: number;
    [key: string]: any;
  };
}

export const defaultPartialCard: PartialCard = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  parent_id: -1,
  created_at: new Date(0),
  updated_at: new Date(0),
  tags: [],
};

export const defaultCard: Card = {
  id: -1,
  card_id: "",
  user_id: -1,
  title: "",
  body: "",
  link: "",
  is_deleted: false,
  created_at: new Date(0),
  updated_at: new Date(0),
  parent_id: -1,
  parent: defaultPartialCard,
  files: [],
  children: [],
  references: [],
  tags: [],
  tasks: [],
  entities: [],
  is_pinned: false,
};

export interface NextIdResponse {
  error: boolean;
  message: string;
  new_id: string;  // Matches the actual backend response
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

export interface CardTemplate {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
}

export const defaultCardTemplate: CardTemplate = {
  id: -1,
  user_id: -1,
  title: "",
  body: "",
  created_at: new Date(0),
  updated_at: new Date(0),
};
