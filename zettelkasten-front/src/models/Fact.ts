import { PartialCard } from "./Card";

export interface FactWithCard {
    id: number;
    fact: string;
    created_at: string;
    updated_at: string;
    card: PartialCard;
}
