import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { getIdByCardId } from "../utils";
import { downloadFile } from "../api";

function preprocessCardLinks(body) {
  // This will find instances of [SomeText] and replace with [SomeText](#)
  return body.replace(/\[([A-Za-z0-9_.-/]+)\]/g, "[$1](#)");
}

const CustomImageRenderer = ({ src, alt, title }) => {
  const [imageSrc, setImageSrc] = useState(null);
  useEffect(() => {
    downloadFile(src)
      .then((blobUrl) => {
        setImageSrc(blobUrl);
      })
      .catch((error) => {
        console.error("Error fetching image:", error);
        // Handle the error case, possibly set a default image or error image
      });
  }, [src]);

  if (!imageSrc) {
    // Optionally render a placeholder or a loader
    return <div>Loading...</div>;
  }

  // You can add more logic here as per your requirements
  return (
    <img
      src={imageSrc}
      alt={alt}
      title={title}
      style={{ maxWidth: "100%", height: "auto" }}
      onClick={() => console.log(`Image clicked: ${src}`)}
    />
  );
};

function renderCardText(card, cards, handleViewBacklink) {
  let body = card.body;
  // Convert bracketed text to markdown links
  body = preprocessCardLinks(body);

  // Custom link component
  const LinkRenderer = ({ children, href }) => {
    const cardId = children;
    const id = getIdByCardId(cards, cardId);

    const linkedCard = card.direct_links
      .filter((x) => x !== null)
      .find((linked) => linked.card_id === cardId);
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
        img: CustomImageRenderer,
      }}
    />
  );
}

export function CardBody(viewingCard, cards, handleViewBacklink) {
  return <div>{renderCardText(viewingCard, cards, handleViewBacklink)}</div>;
}
