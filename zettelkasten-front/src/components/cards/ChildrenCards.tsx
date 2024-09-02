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
  const [showChildren, setShowChildren] = useState<boolean>(false);

  function handleIconClick() {
    console.log("click");
    setShowChildren(!showChildren);
  }
  return (

    <ul>
      {allChildren.filter((c) => c.parent_id === card.id).map((c, index) => (
        <li className="flex flex-col">
          <div className="flex items-center">
	  <span className="mr -2" onClick={handleIconClick}>
	  {showChildren ?
            <TriangleDownIcon /> : <TriangleRightIcon />
	  }
	  </span>
            <CardListItem card={c} />
          </div>
	  {showChildren && (
          <div className="ml-6">
            <ChildrenCards allChildren={allChildren} card={c} />
          </div>
	    
	  )}
        </li>
      ))}
    </ul>
  );
}
