import { Link, useNavigate } from "react-router-dom";

export function CardItem({ handleViewCard, card }) {
  const navigate = useNavigate();
  return (
    <div key={card.id}>
      <Link to={`/app/card/${card.id}`} style={{ textDecoration: 'none', color: 'inherit'}}>
        <span style={{ color: "blue", fontWeight: "bold" }}>
         - {card.card_id}
        </span>
        : {card.title}
        </Link>
      </div>
  );
}
