import React from "react";
import { Button } from "../Button";
import { Card } from "../../models/Card";
import { deleteCard } from "../../api/cards";
import { usePartialCardContext } from "../../contexts/CardContext";

interface ButtonCardDeleteProps {
  card: Card;
  setMessage: (message: string) => void;
}

export function ButtonCardDelete({ card, setMessage }: ButtonCardDeleteProps) {
  const { setRefreshPartialCards } = usePartialCardContext();
  function handleDeleteButtonClick() {
    if (
      window.confirm(
        "Are you sure you want to delete this card? This cannot be reversed"
      )
    ) {
      deleteCard(card.id)
        .then(() => setRefreshPartialCards(true))
        .catch((error) =>
          setMessage(
            "Unable to delete card. Does it have backlinks, children or files?"
          )
        );
    }
  }

  return <Button onClick={handleDeleteButtonClick} children={"Delete"} />;
}
