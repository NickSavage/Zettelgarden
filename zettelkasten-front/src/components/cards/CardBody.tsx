import Markdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
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

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  rowIndex?: number;
  colIndex?: number;
  tableIndex?: number;
  onCellEdit?: (tableIndex: number, rowIndex: number, colIndex: number, newValue: string) => void;
}

const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  rowIndex, 
  colIndex, 
  tableIndex,
  onCellEdit,
  ...props 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(children?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing && rowIndex !== undefined && colIndex !== undefined && tableIndex !== undefined) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (isEditing && rowIndex !== undefined && colIndex !== undefined && tableIndex !== undefined && onCellEdit) {
      onCellEdit(tableIndex, rowIndex, colIndex, editValue);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isEditing && rowIndex !== undefined && colIndex !== undefined && tableIndex !== undefined && onCellEdit) {
        onCellEdit(tableIndex, rowIndex, colIndex, editValue);
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setEditValue(children?.toString() || '');
      setIsEditing(false);
    }
  };

  return (
    <td 
      className={`py-2 px-4 border ${isEditing ? 'p-0' : ''}`} 
      onClick={handleClick}
      {...props}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="w-full h-full p-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        children
      )}
    </td>
  );
};

interface CustomImageRendererProps {
  src?: string; // Make src optional
  alt?: string; // Make alt optional
  title?: string; // Make title optional
}

interface CardBodyProps {
  viewingCard: Card;
  onCardUpdate?: (updatedCard: Card) => void;
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

// Utility function to update a table cell in markdown text
function updateTableCellInMarkdown(
  markdown: string, 
  tableIndex: number, 
  rowIndex: number, 
  colIndex: number, 
  newValue: string
): string {
  console.log(`Updating table ${tableIndex}, row ${rowIndex}, col ${colIndex} with value "${newValue}"`);
  
  // Split the markdown into lines
  const lines = markdown.split('\n');
  
  // Find all tables in the markdown
  const tables: { startLine: number; rows: number[] }[] = [];
  let currentTable: { startLine: number; rows: number[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = line.includes('|');
    
    if (isTableRow) {
      if (!currentTable) {
        // Start of a new table
        currentTable = { startLine: i, rows: [i] };
        tables.push(currentTable);
      } else {
        // Continue existing table
        currentTable.rows.push(i);
      }
    } else if (currentTable) {
      // End of current table
      currentTable = null;
    }
  }
  
  // Check if we have the requested table
  if (tableIndex >= tables.length) {
    console.error(`Table index ${tableIndex} out of bounds (${tables.length} tables found)`);
    return markdown;
  }
  
  const table = tables[tableIndex];
  
  // We need at least header row + separator row + data row
  if (table.rows.length < 3) {
    console.error(`Table has insufficient rows: ${table.rows.length}`);
    return markdown;
  }
  
  // Calculate the actual row index (skip header and separator rows)
  const dataRowIndex = rowIndex + 2; // +2 to skip header and separator
  
  if (dataRowIndex >= table.rows.length) {
    console.error(`Row index ${rowIndex} (data row ${dataRowIndex}) out of bounds (${table.rows.length} rows found)`);
    return markdown;
  }
  
  // Get the line number for the target row
  const targetLineNumber = table.rows[dataRowIndex];
  const targetLine = lines[targetLineNumber];
  
  // Split the row into cells
  const cells = targetLine.split('|');
  
  // Remove the first and last empty cells (from the leading and trailing |)
  // Note: If the line starts or ends with |, the first/last elements will be empty strings
  const actualCells = cells.filter((_, index) => index > 0 && index < cells.length - 1);
  
  // Check if we have the requested column
  if (colIndex >= actualCells.length) {
    console.error(`Column index ${colIndex} out of bounds (${actualCells.length} columns found)`);
    return markdown;
  }
  
  // Update the cell (preserve whitespace padding)
  const originalCell = actualCells[colIndex];
  const leadingSpaceMatch = originalCell.match(/^\s*/);
  const trailingSpaceMatch = originalCell.match(/\s*$/);
  const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
  const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';
  actualCells[colIndex] = `${leadingSpace}${newValue}${trailingSpace}`;
  
  // Reconstruct the row
  const newRow = `|${actualCells.join('|')}|`;
  
  // Update the line in the markdown
  lines[targetLineNumber] = newRow;
  
  // Join the lines back together
  return lines.join('\n');
}

function renderCardText(
  card: Card,
  handleViewBacklink: (card_id: number) => void,
  onCardUpdate?: (updatedCard: Card) => void
) {
  let body = card.body;
  body = preprocessCardLinks(body);

  // Create state to track indices
  // Reset these on each render to ensure consistent counting
  const tableCount = React.useRef(0);
  const rowCounts = React.useRef<Record<number, number>>({});
  const colCounts = React.useRef<Record<string, number>>({});
  
  // Reset counters
  tableCount.current = 0;
  rowCounts.current = {};
  colCounts.current = {};

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
        table(props) {
          // Assign a unique index to this table
          const tableIndex = tableCount.current;
          tableCount.current += 1;
          
          // Initialize row counter for this table
          rowCounts.current[tableIndex] = 0;
          
          return <Table {...props} data-table-index={tableIndex}>{props.children}</Table>;
        },
        thead(props) {
          return <TableHead {...props}>{props.children}</TableHead>;
        },
        tbody(props) {
          return <TableBody {...props}>{props.children}</TableBody>;
        },
        tr(props) {
          // Get the parent table index from the closest ancestor
          const tableIndex = props['data-table-index'] || 0;
          
          // Skip header and separator rows (first two rows)
          // Only count data rows (starting from the third row)
          if (rowCounts.current[tableIndex] >= 2) {
            // This is a data row, initialize column counter
            const rowIndex = rowCounts.current[tableIndex] - 2; // Adjust to 0-based data row index
            colCounts.current[`${tableIndex}-${rowIndex}`] = 0;
          }
          
          // Increment row counter for this table
          rowCounts.current[tableIndex] = (rowCounts.current[tableIndex] || 0) + 1;
          
          return (
            <TableRow 
              {...props} 
              data-table-index={tableIndex} 
              data-row-index={rowCounts.current[tableIndex] - 1}
            >
              {props.children}
            </TableRow>
          );
        },
        th(props) {
          return <TableHeader {...props}>{props.children}</TableHeader>;
        },
        td(props) {
          // Extract children and other props
          const { children, ...rest } = props;
          
          // Use the current table index
          const tableIndex = tableCount.current - 1;
          
          // Get the current row index for this table
          // We need to determine if this is a header, separator, or data row
          const currentRowCount = rowCounts.current[tableIndex] || 0;
          
          // Calculate if this is a data row (not header or separator)
          const isDataRow = currentRowCount > 2;
          
          // For data rows, calculate the data row index (0-based)
          const dataRowIndex = isDataRow ? currentRowCount - 3 : 0;
          
          // Generate a unique key for this cell based on table and row
          const cellKey = `${tableIndex}-${dataRowIndex}`;
          
          // Get and increment column index for this row
          let colIndex = colCounts.current[cellKey] || 0;
          colCounts.current[cellKey] = colIndex + 1;
          
          console.log(`Cell at table=${tableIndex}, row=${dataRowIndex}, col=${colIndex}, content="${children}"`);
          
          // Handle cell edit for all cells
          const handleCellEdit = (tableIdx: number, rowIdx: number, colIdx: number, newValue: string) => {
            if (onCardUpdate) {
              console.log(`Editing cell: table=${tableIdx}, row=${rowIdx}, col=${colIdx}, value="${newValue}"`);
              const updatedBody = updateTableCellInMarkdown(card.body, tableIdx, rowIdx, colIdx, newValue);
              onCardUpdate({
                ...card,
                body: updatedBody
              });
            }
          };
          
          // Make all cells editable for now for debugging
          return (
            <TableCell 
              {...rest} 
              tableIndex={tableIndex} 
              rowIndex={dataRowIndex} 
              colIndex={colIndex} 
              onCellEdit={handleCellEdit}
            >
              {children}
            </TableCell>
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

export const CardBody: React.FC<CardBodyProps> = ({ viewingCard, onCardUpdate }) => {
  const navigate = useNavigate();

  function handleCardClick(card_id: number) {
    navigate(`/app/card/${card_id}`);
  }

  return <div>{renderCardText(viewingCard, handleCardClick, onCardUpdate)}</div>;
};
