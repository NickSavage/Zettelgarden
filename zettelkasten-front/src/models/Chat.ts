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
  updated_at: Date;
  cards: PartialCard[];
  referenced_card_pk: number[];
  user_query: string;
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

export interface LLMProvider {
  id: number;
  name: string;
  base_url: string;
  api_key_required: boolean;
  api_key?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LLMModel {
  id: number;
  provider_id: number;
  name: string;
  model_identifier: string;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  provider?: LLMProvider;
}

export interface UserLLMConfiguration {
  id: number;
  user_id: number;
  model_id: number;
  api_key?: string;
  custom_settings: Record<string, any>;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  model?: LLMModel;
}
