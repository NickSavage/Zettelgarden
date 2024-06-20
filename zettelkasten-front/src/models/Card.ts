import { File } from "./File";

// src/models/PartialCard.ts
export interface PartialCard {
    id: number;
    card_id: string;
    user_id: number;
    title: string;
    created_at: Date;
    updated_at: Date;
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
    parent: PartialCard;
    files: File[];
    children: PartialCard[];
    references: PartialCard[];
 }
