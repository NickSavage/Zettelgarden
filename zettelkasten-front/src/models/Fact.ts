export interface Fact {
  id: number;
  fact: string;
  created_at: string;
  updated_at: string;
}

export interface FactWithCard {
  id: number;
  fact: string;
  created_at: string;
  updated_at: string;
  card?: {
    id: number;
    card_id: string;
    title: string;
  };
}
