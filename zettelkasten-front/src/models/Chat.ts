import { PartialCard } from "./Card"

export interface ChatCompletion {
  id: number;
  user_id: number;
  conversation_id: string;
  sequence_number: number;
  role: string;
  content: string;
  refusal: string | null;
  model: string;
  tokens: number;
  created_at: Date;
  cards: PartialCard[];
}

export interface ConversationSummary {
  id: string;
  message_count: number;
  created_at: Date;
  updated_at: Date;
  model: string;
  title: string;
  user_id: number;
}
