import Markdown from "react-markdown";
import { getIdByCardId } from "../utils";

function preprocessCardLinks(body) {
  // This will find instances of [SomeText] and replace with [SomeText](#)
  return body.replace(/\[([A-Za-z0-9_.-/]+)\]/g, "[$1](#)");
}

function renderCardText(card, cards, handleViewBacklink) {
  let body = card.body;
  // Convert bracketed text to markdown links
  body = preprocessCardLinks(body);

  // Custom link component
  const LinkRenderer = ({ children, href }) => {
    const cardId = children;
    console.log([cardId, href]);
    const id = getIdByCardId(cards, cardId);

    const linkedCard = card.direct_links.find(
      (linked) => linked.card_id === cardId,
    );
    const title = linkedCard ? linkedCard.title : "Card not found";

    console.log([cardId, id, linkedCard, title]);
    return (
      <a
        href="#"
        title={title}
        onClick={(e) => {
          e.preventDefault();
          handleViewBacklink({ id: id, card_id: cardId });
        }}
        style={{ fontWeight: "bold", color: "blue" }}
      >
        [{cardId}]
      </a>
    );
  };


  return (
    <Markdown
      children={body}
      components={{
        a: LinkRenderer,
      }}
    />
  );
}

export function CardBody({viewingCard, cards, handleViewBacklink}) {
    console.log(viewingCard);
  return <div>{renderCardText(viewingCard, cards, handleViewBacklink)}</div>;
}
