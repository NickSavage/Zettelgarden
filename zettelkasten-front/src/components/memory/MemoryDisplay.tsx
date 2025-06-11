import Markdown from "react-markdown";
import React from "react";
import remarkGfm from "remark-gfm";
import { H1, H2, H3, H4, H5, H6 } from "../Header";
import { 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableHeader, 
  TableCell 
} from "../table/TableComponents";

interface MemoryDisplayProps {
  memory: string;
}

export const MemoryDisplay: React.FC<MemoryDisplayProps> = ({ memory }) => {
  return (
    <Markdown
      children={memory}
      remarkPlugins={[remarkGfm]}
      components={{
        h1({ children, ...props }) {
          return <H1 children={children as string} />;
        },
        h2({ children, ...props }) {
          return <H2 children={children as string} />;
        },
        h3({ children, ...props }) {
          return <H3 children={children as string} />;
        },
        h4({ children, ...props }) {
          return <H4 children={children as string} />;
        },
        h5({ children, ...props }) {
          return <H5 children={children as string} />;
        },
        h6({ children, ...props }) {
          return <H6 children={children as string} />;
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
        a({ children, href, ...props }) {
          // For external links, render a regular anchor tag
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          );
        },
      }}
    />
  );
};
