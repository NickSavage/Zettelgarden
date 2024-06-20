import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../models/Card";

interface CardItemProps {
  card: Card;
}

export function CardItem({ card }: CardItemProps) {
  return (
    <div key={card.id}>
      <Link to={`/app/card/${card.id}`} style={{ textDecoration: 'none', color: 'inherit'}}>
        <span style={{ color: "blue", fontWeight: "bold" }}>
         - {card.card_id}
        </span>
        : {card.title}
        </Link>
      </div>
  );
}
