export function BacklinkInputDropdownList({cards}) {
    return (
      <ul className="input-link-dropdown">
        {cards.map((card, index) => (
          <li
            key={card.card_id}
            style={{
              background: "lightgrey",
              cursor: "pointer",
            }}
          >
            {card.card_id} - {card.title}
          </li>
        ))}
      </ul>
    );
}
