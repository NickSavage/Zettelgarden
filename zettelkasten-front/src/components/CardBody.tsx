import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { getIdByCardId } from "../utils";
import { downloadFile } from "../api/files";
import { Card, PartialCard } from "../models/Card";
import { useNavigate } from "react-router-dom";

interface CustomImageRendererProps {
  src?: string; // Make src optional
  alt?: string; // Make alt optional
  title?: string; // Make title optional
}

interface CardBodyProps {
  viewingCard: Card;
  cards: PartialCard[];
}

function preprocessCardLinks(body: string): string {
  return body.replace(/\[([A-Za-z0-9_.-/]+)\]/g, "[$1](#)");
}

const CustomImageRenderer: React.FC<CustomImageRendererProps> = ({ src, alt, title }) => {
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    if (src) {
      downloadFile(src)
        .then((blobUrl) => {
          if (blobUrl) {
            setImageSrc(blobUrl);
          }
        })
        .catch((error) => {
          console.error("Error fetching image:", error);
        });
    }
  }, [src]);

  if (!imageSrc) {
    return <div>Loading...</div>;
  }

  return (
    <img
      src={imageSrc}
      alt={alt || "Image"}
      title={title || ""}
      style={{ maxWidth: "100%", height: "auto" }}
      onClick={() => console.log(`Image clicked: ${src}`)}
    />
  );
};

function renderCardText(card: Card, cards: PartialCard[], handleViewBacklink: (card_id: number) => void) {
  let body = card.body;
  body = preprocessCardLinks(body);

  return (
    <Markdown
      children={body}
      components={{
        a({ children, href, ...props }) {
          const cardId = children as string;
          const id = getIdByCardId(cards, parseInt(cardId, 10));
          const linkedCard = card.references
            .filter((x) => x !== null)
            .find((linked) => linked.card_id === cardId);
          const title = linkedCard ? linkedCard.title : "Card not found";

          return (
            <a
              href="#"
              title={title}
              onClick={(e) => {
                e.preventDefault();
                handleViewBacklink(id);
              }}
              style={{ fontWeight: "bold", color: "blue" }}
              {...props}
            >
              [{cardId}]
            </a>
          );
        },
        img({ src, alt, title, ...props }) {
          return <CustomImageRenderer src={src} alt={alt} title={title} {...props} />;
        },
      }}
    />
  );
}

export const CardBody: React.FC<CardBodyProps> = ({ viewingCard, cards }) => {
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  return <div>{renderCardText(viewingCard, cards, handleCardClick)}</div>;
};
