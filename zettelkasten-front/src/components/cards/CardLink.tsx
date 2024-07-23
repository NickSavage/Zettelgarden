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
    <div>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleViewBacklink(card!.id);
        }}
        style={{ fontWeight: "bold", color: "blue" }}
      >
        [{card.card_id}]
      </a>
      {showTitle && <span>{": "}card.title</span>}
    </div>
  );
}
