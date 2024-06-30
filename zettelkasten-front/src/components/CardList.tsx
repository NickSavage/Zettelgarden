import React from "react";

import { CardItem } from "./CardItem";
import { PartialCard } from "../models/Card";

interface CardListProps {
  cards: PartialCard[];
}

export function CardList({ cards }: CardListProps) {
  return (
    <ul>
      {cards
        .sort((a, b) => a.card_id.localeCompare(b.card_id))
        .map((backlink, index) => (
          <li style={{ paddingTop: "5px", paddingBottom: "5px" }}>
            <CardItem card={backlink} />
          </li>
        ))}
    </ul>
  );
}
