import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { downloadFile } from "../../api/files";
import { Card, Entity } from "../../models/Card";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw'

import { CardLinkWithPreview } from "./CardLinkWithPreview";
import { H1, H2, H3, H4, H5, H6 } from "../Header";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell
} from "../table/TableComponents";
import { DataviewTable } from "../dataview/DataviewTable";
import { saveExistingCard } from "../../api/cards";

interface CustomImageRendererProps {
  src?: string; // Make src optional
  alt?: string; // Make alt optional
  title?: string; // Make title optional
}

interface CardBodyProps {
  viewingCard: Card;
  entities?: Entity[];
}

function preprocessCardLinks(body: string): string {
  // Only match IDs without parentheses after - this preserves standard markdown links
  return body.replace(/\[([A-Za-z0-9_.-/]+)\](?!\()/g, "[$1](#)");
}

// Preprocess entity highlighting by injecting placeholder markers into markdown text
function preprocessEntities(body: string, entities?: Entity[]): string {
  if (!entities || entities.length === 0) return body;

  // Sort entities by length (desc) to avoid partial match conflicts
  const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

  let processed = body;

  sortedEntities.forEach(entity => {
    const escapedName = entity.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedName})`, "gi");
    processed = processed.replace(
      regex,
      (match) => `<span style="background-color: #fff9c4;">${match}</span>`
    );
  });

  return processed;
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
  entities?: Entity[]
) {

  // Preprocess card links first, then entities with safe markers
  let processedBody = preprocessEntities(preprocessCardLinks(card.body), entities);
  //let processedBody = preprocessCardLinks(cardBody)

  // Custom component for handling our dataview code blocks
  const CustomCodeBlock = ({ node, inline, className, children, ...props }: any) => {
    // Otherwise render as regular code block
    return (
      <pre className={className}>
        <code {...props}>{children}</code>
      </pre>
    );
  };

  return (
    <Markdown
      children={processedBody}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Add our custom component for code blocks
        code: CustomCodeBlock,
        a({ children, href, ...props }) {
          // For internal links, href will be "#" and children will be the card ID
          if (href === "#") {
            const cardId = children as string;
            return (
              <CardLinkWithPreview
                currentCard={card}
                card_id={cardId}
                handleViewBacklink={handleViewBacklink}
              />
            );
          }
          // For external links, render a regular anchor tag
          else {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          }
        },
        h1({ children, ...props }) {
          return (<H1 children={children as string} />)
        },
        h2({ children, ...props }) {
          return (<H2 children={children as string} />)
        },
        h3({ children, ...props }) {
          return (<H3 children={children as string} />)
        },
        h4({ children, ...props }) {
          return (<H4 children={children as string} />)
        },
        h5({ children, ...props }) {
          return (<H5 children={children as string} />)
        },
        h6({ children, ...props }) {
          return (<H6 children={children as string} />)
        },
        // Table components
        table({ children, ...props }) {
          return <Table {...props}>{children}</Table>;
        },
        thead({ children, ...props }) {
          return <TableHead {...props}>{children}</TableHead>;
        },
        tbody({ children, ...props }) {
          return <TableBody {...props}>{children}</TableBody>;
        },
        tr({ children, ...props }) {
          return <TableRow {...props}>{children}</TableRow>;
        },
        th({ children, ...props }) {
          return <TableHeader {...props}>{children}</TableHeader>;
        },
        td({ children, ...props }) {
          return <TableCell {...props}>{children}</TableCell>;
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

export const CardBody: React.FC<CardBodyProps> = ({ viewingCard, entities }) => {
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  return <div>{renderCardText(viewingCard, handleCardClick, entities)}</div>;
};
