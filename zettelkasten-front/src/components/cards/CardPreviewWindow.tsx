import React, { useEffect, useState } from "react";

import { getCard } from "../../api/cards";
import { PartialCard, Card } from "../../models/Card";
import { CardBody } from "./CardBody";
import { isErrorResponse } from "../../models/common";

interface CardPreviewWindowProps {
  card: PartialCard;
  mousePosition: { x: number; y: number };
}

export function CardPreviewWindow({
  card,
  mousePosition,
}: CardPreviewWindowProps) {
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
  }, [card.id]);
  const windowHeight = window.innerHeight;
  const previewHeight = 300; // Approximate height of your preview window, adjust as needed
  const topPosition =
    mousePosition.y + previewHeight > windowHeight
      ? mousePosition.y - previewHeight
      : mousePosition.y;

  return (
    <div
      className="card-preview-window"
      style={{
        top: topPosition,
        left: mousePosition.x + 10,
        position: "absolute",
      }}
    >
      {error && <div>{error}</div>}
      {viewingCard && (
        <div>
          <h3 style={{ marginBottom: "10px" }}>
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {card.card_id}
            </span>
            <span>: {card.title}</span>
          </h3>
          <div>
            <CardBody viewingCard={viewingCard} />
          </div>
        </div>
      )}
    </div>
  );
}