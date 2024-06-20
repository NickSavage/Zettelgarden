import React from "react";
import { Link } from "react-router-dom";
import { PartialCard } from "../models/Card";

interface CardItemProps {
  card: PartialCard;
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
