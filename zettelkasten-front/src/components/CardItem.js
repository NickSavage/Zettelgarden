import { useNavigate } from "react-router-dom";
export function CardItem({ handleViewCard, card }) {
  const navigate = useNavigate();
  function handleCardClick(card_id) {
    navigate(`/app/card/${card_id}`);
  }
  return (
    <div key={card.id} onClick={() => handleCardClick(card.id)}>
        <span style={{ color: "blue", fontWeight: "bold" }}>
          {card.card_id}
        </span>
        : {card.title}
      </div>
  );
}
