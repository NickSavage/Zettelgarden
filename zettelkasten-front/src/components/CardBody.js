import Markdown from "react-markdown";
import { getIdByCardId } from "../utils";

function renderCardText(card, cards, handleViewBacklink) {
  const body = card.body;
  const parts = body.split(/(\[[A-Za-z0-9_.-/]+\])|(\n)/);
  return parts.map((part, i) => {
    // If part is a new line character, return a break element
    if (part === "\n") {
      return <br key={i} />;
    }
    // If part is a bracketed word, render a link
    else if (part && part.startsWith("[") && part.endsWith("]")) {
      const cardId = part.substring(1, part.length - 1);
      const id = getIdByCardId(cards, cardId);

      const linkedCard = card.direct_links.find(
        (linked) => linked.card_id === cardId,
      );
      const title = linkedCard ? linkedCard.title : "Card not found";
      return (
        <a
          key={i}
          title={title}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleViewBacklink({ id: id, card_id: cardId });
          }}
          style={{ fontWeight: "bold", color: "blue" }}
        >
          {part}
        </a>
      );
    }
    // Otherwise, just render the text
    return part;
  });
}

export function CardBody(viewingCard, cards, handleViewBacklink) {
  return <div>{renderCardText(viewingCard, cards, handleViewBacklink)}</div>;
}
