import { useNavigate } from "react-router-dom";
export function CardItem({ handleViewCard, card }) {
  const navigate = useNavigate();
  function handleCardClick(card_id) {
    navigate(`/app/card/${card_id}`);
  }
  return (
    <li style={{ marginBottom: "10px" }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleCardClick(card.id);
        }}
        style={{ color: "black", textDecoration: "none" }}
      >
        <span style={{ color: "blue", fontWeight: "bold" }}>
          {card.card_id}
        </span>
        : {card.title}
      </a>
    </li>
  );
}
