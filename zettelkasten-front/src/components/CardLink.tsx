import React, {useState} from "react";

import { Card, PartialCard } from "../models/Card";
import { getIdByCardId } from "../utils";

interface CardLinkProps {
    card: Card;
    cards: PartialCard[];
    card_id: string;
    handleViewBacklink: (card_id: number) => void;
}

export function CardLink({card, cards, card_id, handleViewBacklink}: CardLinkProps) {

    const id = getIdByCardId(cards, card_id);
    const linkedCard = card.references
        .filter((x) => x !== null)
        .find((linked) => linked.card_id === card_id);
    const title = linkedCard ? linkedCard.title : "Card not found";
    return (
        <span>
            <a
              href="#"
              title={title}
              onClick={(e) => {
                e.preventDefault();
                handleViewBacklink(id);
              }}
              style={{ fontWeight: "bold", color: "blue" }}
            >
              [{card_id}]
            </a>
        </span>
    )

}