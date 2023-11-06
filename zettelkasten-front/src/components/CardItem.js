export function CardItem({ handleViewCard, card }) {
  return (
    <li style={{ marginBottom: "10px" }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleViewCard(card);
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
