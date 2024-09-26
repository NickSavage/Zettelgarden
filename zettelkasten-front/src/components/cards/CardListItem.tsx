import React, { useState } from "react";
import { PartialCard } from "../../models/Card";
import { CardPreviewWindow } from "./CardPreviewWindow";
import { CardLink } from "./CardLink";
import { PlusCircleIcon } from "../../assets/icons/PlusCircleIcon";
import { formatDate } from "../../utils/dates";
import { usePartialCardContext } from "../../contexts/CardContext";
import { useNavigate } from "react-router-dom";

interface CardListItemProps {
  card: PartialCard;
  showAddButton?: boolean;
}

export function CardListItem({
  card,
  showAddButton = true,
}: CardListItemProps) {
  const [showHover, setShowHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { setLastCard } = usePartialCardContext();

  const navigate = useNavigate();

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowHover(true);
  };

  function handleAddCardClick() {
    setLastCard(card);
    navigate("/app/card/new");
  }

  return (
    <div key={card.id} className="card-item py-2 px-2.5 flex w-full">
      <div className="pr-4">
        <span
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowHover(false)}
        >
          <CardLink
            card={card}
            handleViewBacklink={(id: number) => {}}
            showTitle={true}
          />
        </span>

        {card.is_flashcard && (
	<span className="pl-2">
          <span className="px-2 text-white bg-cyan-500 text-sm rounded-lg">
            Flashcard
          </span>
	</span>
        )}
      </div>
      <div className="flex-grow">
        {showAddButton && (
          <span onClick={handleAddCardClick}>
            <PlusCircleIcon />
          </span>
        )}
      </div>
      <div className="flex text-xs">{formatDate(card.created_at)}</div>

      {showHover && card && (
        <CardPreviewWindow cardPK={card.id} mousePosition={mousePosition} />
      )}
    </div>
  );
}
