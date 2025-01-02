import React, { useState, useEffect } from "react";
import { SearchResultList } from "../../components/cards/SearchResultList";
import { CardListItem } from "./CardListItem";
import { TriangleDownIcon } from "../../assets/icons/TriangleDown";
import { TriangleRightIcon } from "../../assets/icons/TriangleRight";

import { Card, PartialCard } from "../../models/Card";

interface ChildrenCardsProps {
  allChildren: PartialCard[];
  card: PartialCard;
}

export function ChildrenCards({ allChildren, card }: ChildrenCardsProps) {
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [childCards, setChildCards] = useState<PartialCard[]>([]);

  function handleIconClick(cardId: string) {
    setOpenCards((prevOpenCards) => ({
      ...prevOpenCards,
      [cardId]: !prevOpenCards[cardId],
    }));
  }

  useEffect(() => {
    let cards = allChildren.filter((c) => c.parent_id === card.id);
    setChildCards(cards);
  }, [card]);

  return (
    <div className="w-full">
      <ul>
        {childCards.map((c, index) => (
          <li key={index} className="flex flex-col">
            <div className="flex items-center">
              <span
                className="mr-2 cursor-pointer"
                onClick={() => handleIconClick(c.card_id)}
              >
                {openCards[c.id] ? <TriangleDownIcon /> : <TriangleRightIcon />}
              </span>
              <CardListItem card={c} />
            </div>
            {openCards[c.card_id] && (
              <div className="ml-6">
                <ChildrenCards allChildren={allChildren} card={c} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
