import React, { useEffect, useState } from "react";

import { getCard } from "../api/cards";
import { PartialCard, Card } from "../models/Card";
import { CardBody } from "./CardBody";
import { isErrorResponse } from "../models/common";

interface CardPreviewWindowProps {
  card: PartialCard;
}

export function CardPreviewWindow({ card }: CardPreviewWindowProps) {
  const [viewingCard, setViewingCard] = useState<Card | null>(null);
  const [error, setError] = useState("");

  async function fetchCard(id: string) {
    let refreshed = await getCard(id);

    if (isErrorResponse(refreshed)) {
      setError(refreshed["error"]);
    } else {
      setViewingCard(refreshed);
    }
  }
  useEffect(() => {
    console.log("asdasasdasd");
    fetchCard(card.id.toString());
  }, []);
  return (
    <div className="card-preview-window">
      {viewingCard && (
        <div>
          <h3 style={{ marginBottom: "10px" }}>
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {card.card_id}
            </span>
            <span>: {card.title}</span>
          </h3>
          <div>
            <CardBody viewingCard={viewingCard} cards={[]} />
          </div>
        </div>
      )}
    </div>
  );
}
