import React from "react";
import { PartialCard } from "../../models/Card";
import { Link } from "react-router-dom";
import { CardTag } from "./CardTag";

interface CardLinkProps {
  card: PartialCard;
  handleViewBacklink: (id: number) => void;
  showTitle: boolean;
}

export function CardLink({ card, showTitle }: CardLinkProps) {
  return (
    <span>
      <Link to={`/app/card/${card.id}`}>
        <CardTag card={card} showTitle={showTitle} />
      </Link>
    </span>
  );
}
