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
}

export interface ConversationSummary {
  conversation_id: string;
  message_count: number;
  created_at: Date;
  model: string;
}
