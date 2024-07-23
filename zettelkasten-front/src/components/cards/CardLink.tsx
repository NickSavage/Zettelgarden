import React from "react";
import { PartialCard } from "../../models/Card";
import { Link } from "react-router-dom";

interface CardLinkProps {
  card: PartialCard;
  handleViewBacklink: (id: number) => void;
  showTitle: boolean;
}

export function CardLink({
  card,
  handleViewBacklink,
  showTitle,
}: CardLinkProps) {
  return (
    <span>
      <Link to={`/app/card/${card.id}`}>
        <span style={{ color: "blue", fontWeight: "bold" }}>
          [{card.card_id}]
        </span>
        {showTitle && <span>{" - "}card.title</span>}
      </Link>
    </span>
  );
}
