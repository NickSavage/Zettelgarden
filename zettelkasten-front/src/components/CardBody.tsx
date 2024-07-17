import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { getIdByCardId } from "../utils";
import { downloadFile } from "../api/files";
import { Card, PartialCard } from "../models/Card";
import { useNavigate } from "react-router-dom";

import { CardLink } from "./CardLink";

interface CustomImageRendererProps {
  src?: string; // Make src optional
  alt?: string; // Make alt optional
  title?: string; // Make title optional
}

interface CardBodyProps {
  viewingCard: Card;
}

function preprocessCardLinks(body: string): string {
  return body.replace(/\[([A-Za-z0-9_.-/]+)\]/g, "[$1](#)");
}

const CustomImageRenderer: React.FC<CustomImageRendererProps> = ({
  src,
  alt,
  title,
}) => {
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

function renderCardText(
  card: Card,
  handleViewBacklink: (card_id: number) => void,
) {
  let body = card.body;
  body = preprocessCardLinks(body);

  return (
    <Markdown
      children={body}
      components={{
        a({ children, href, ...props }) {
          const cardId = children as string;

          return (
            <span>
              <CardLink
                currentCard={card}
                card_id={cardId}
                handleViewBacklink={handleViewBacklink}
              />
            </span>
          );
        },
        img({ src, alt, title, ...props }) {
          return (
            <CustomImageRenderer src={src} alt={alt} title={title} {...props} />
          );
        },
      }}
    />
  );
}

export const CardBody: React.FC<CardBodyProps> = ({ viewingCard }) => {
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  return <div>{renderCardText(viewingCard, handleCardClick)}</div>;
};
