import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { downloadFile } from "../../api/files";
import { Card, Entity } from "../../models/Card";
import remarkEntity from "../../remark-entity";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";

import { useShortcutContext } from "../../contexts/ShortcutContext";

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
//import { fetchEntityByName } from "../../api/entities";
import { fetchEntityById } from "../../api/entities";

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

  // Sort entities by length (desc) to give priority to longer entity names
  const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

  // Collect all matches for all entities
  type Match = { start: number; end: number; id: number; text: string };
  const matches: Match[] = [];

  sortedEntities.forEach(entity => {
    const escapedName = entity.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b(${escapedName})\\b`, "gi");
    let match;
    while ((match = regex.exec(body)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        id: entity.id,
        text: match[0]
      });
    }
  });

  // Sort matches by start index, then by length descending
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Filter to remove overlapping matches, keeping the longest first
  const nonOverlapping: Match[] = [];
  let lastEnd = -1;
  matches.forEach(m => {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  });

  // Build the processed string with replacements
  let result = "";
  let currentIndex = 0;
  nonOverlapping.forEach(m => {
    result += body.slice(currentIndex, m.start);
    result += `&ENTITY:${m.id}:${m.text}&`;
    currentIndex = m.end;
  });
  result += body.slice(currentIndex);

  return result;
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

function renderCardTextWithDialog(
  card: Card,
  handleViewBacklink: (card_id: number) => void,
  entities?: Entity[]
) {
  const [isEntityDialogOpen, setIsEntityDialogOpen] = React.useState(false);


  const {
    showEntityDialog,
    setShowEntityDialog,
    selectedEntity,
    setSelectedEntity,
  } = useShortcutContext();

  async function handleEntityClickById(id: string, name: string) {
    try {
      const entity = await fetchEntityById(Number(id));
      setSelectedEntity(entity);
    } catch (error) {
      console.error("Failed to fetch entity details:", error);
      const fallbackEntity: Entity = {
        id: Number(id) || 0,
        user_id: 0,
        name,
        type: "UNKNOWN",
        description: "",
        created_at: new Date(),
        updated_at: new Date(),
        card_count: 0,
        card_pk: null,
      };
      setSelectedEntity(fallbackEntity);
    }
    setShowEntityDialog(true);
  }

  const markdown = renderCardText(card, handleViewBacklink, entities, handleEntityClickById as any);
  return (
    <>
      {markdown}
    </>
  );
}

function renderCardText(
  card: Card,
  handleViewBacklink: (card_id: number) => void,
  entities?: Entity[],
  onEntityClick?: (id: string, name: string) => void
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
      remarkPlugins={[remarkGfm, remarkEntity]}
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
        span: ({ node, children, ...props }) => {
          const propsData = (node as any).properties || {};
          if (propsData.className === "entity" || propsData["data-id"]) {
            const id = propsData["data-id"];
            const name = propsData["data-name"] || children;
            return (
              <span
                style={{ backgroundColor: "#fff9c4", cursor: "pointer" }}
                onClick={() => onEntityClick?.(id, name)}
              >
                {name}
              </span>
            );
          }
          return <span {...props}>{children}</span>;
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

  return <div>{renderCardTextWithDialog(viewingCard, handleCardClick, entities)}</div>;
};
