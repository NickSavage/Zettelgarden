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
