import Markdown from "react-markdown";
import React, { useState, useEffect } from "react";
import { downloadFile } from "../../api/files";
import { Card } from "../../models/Card";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";

import { CardLinkWithPreview } from "./CardLinkWithPreview";
import { H1, H2, H3, H4,H5,H6 } from "../Header";

// Table components
const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => (
  <table className="min-w-full border-collapse my-4" {...props}>
    {children}
  </table>
);

const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <thead className="bg-gray-100" {...props}>
    {children}
  </thead>
);

const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <tbody {...props}>
    {children}
  </tbody>
);

const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <tr className="border-b" {...props}>
    {children}
  </tr>
);

const TableHeader: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => (
  <th className="py-2 px-4 font-bold text-left border" {...props}>
    {children}
  </th>
);

const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => (
  <td className="py-2 px-4 border" {...props}>
    {children}
  </td>
);

interface CustomImageRendererProps {
  src?: string; // Make src optional
  alt?: string; // Make alt optional
  title?: string; // Make title optional
}

interface CardBodyProps {
  viewingCard: Card;
}

function preprocessCardLinks(body: string): string {
  // Only match IDs without parentheses after - this preserves standard markdown links
  return body.replace(/\[([A-Za-z0-9_.-/]+)\](?!\()/g, "[$1](#)");
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
  handleViewBacklink: (card_id: number) => void
) {
  let body = card.body;
  body = preprocessCardLinks(body);

  return (
    <Markdown
      children={body}
      remarkPlugins={[remarkGfm]}
      components={{
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
        h1( {children, ...props}) {
          return (<H1 children={children as string}/>)
        },
        h2( {children, ...props}) {
          return (<H2 children={children as string}/>)
        },
        h3( {children, ...props}) {
          return (<H3 children={children as string}/>)
        },
        h4( {children, ...props}) {
          return (<H4 children={children as string}/>)
        },
        h5( {children, ...props}) {
          return (<H5 children={children as string}/>)
        },
        h6( {children, ...props}) {
          return (<H6 children={children as string}/>)
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

export const CardBody: React.FC<CardBodyProps> = ({ viewingCard }) => {
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  return <div>{renderCardText(viewingCard, handleCardClick)}</div>;
};
