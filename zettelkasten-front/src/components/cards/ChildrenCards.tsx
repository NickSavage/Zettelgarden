import React, {useState} from "react";
import { CardList } from "../../components/cards/CardList";
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

  function handleIconClick(cardId: string) {
    setOpenCards((prevOpenCards) => ({
      ...prevOpenCards,
      [cardId]: !prevOpenCards[cardId],
    }));
  }

  return (
    <ul>
      {allChildren.filter((c) => c.parent_id === card.id).map((c, index) => (
        <li key={index} className="flex flex-col">
          <div className="flex items-center">
            <span className="mr-2 cursor-pointer" onClick={() => handleIconClick(c.id)}>
              {openCards[c.id] ? <TriangleDownIcon /> : <TriangleRightIcon />}
            </span>
            <CardListItem card={c} />
          </div>
          {openCards[c.id] && (
            <div className="ml-6">
              <ChildrenCards allChildren={allChildren} card={c} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
