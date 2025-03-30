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
  
  // More reliable table detection with detailed logging
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if the line is part of a table (contains | but not in code blocks)
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    
    if (isTableRow) {
      if (!currentTable) {
        // Start of a new table
        currentTable = { startLine: i, rows: [i] };
        tables.push(currentTable);
        console.log(`Found start of table ${tables.length-1} at line ${i}: "${line}"`);
      } else {
        // Continue existing table
        currentTable.rows.push(i);
        console.log(`Added row to table ${tables.length-1} at line ${i}: "${line}"`);
      }
    } else if (currentTable && line.trim() === '') {
      // Empty line marks end of current table
      console.log(`End of table ${tables.length-1} detected at line ${i}`);
      currentTable = null;
    }
  }
  
  // Make sure to close any open table (for tables at the end of the document)
  if (currentTable !== null) {
    console.log(`Closing table ${tables.length-1} at end of document`);
    currentTable = null;
  }
  
  // Log all detected tables
  for (let i = 0; i < tables.length; i++) {
    console.log(`Table ${i} details:`);
    console.log(`  Start line: ${tables[i].startLine}`);
    console.log(`  Row count: ${tables[i].rows.length}`);
    console.log(`  Rows: ${tables[i].rows.join(', ')}`);
    
    // Print each row's content
    tables[i].rows.forEach((rowLineNum, rowIndex) => {
      console.log(`  Row ${rowIndex} (line ${rowLineNum}): "${lines[rowLineNum]}"`);
    });
  }
  
  console.log(`Found ${tables.length} tables in markdown`);
  
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
  
  // In the markdown, rows are indexed as follows:
  // row 0: header row
  // row 1: separator row (---|---)
  // row 2+: data rows
  
  // In our React component, dataRowIndex starts at 0 for the first data row
  // So to convert from dataRowIndex to markdown row index:
  // markdown row index = dataRowIndex + 2
  
  // First, make sure we don't exceed the table bounds
  if (rowIndex >= (table.rows.length - 2)) {
    console.error(`Data row index ${rowIndex} out of bounds, table only has ${table.rows.length} rows total (${table.rows.length - 2} data rows)`);
    rowIndex = Math.max(0, table.rows.length - 3); // Use the first data row if out of bounds
  }
  
  const actualRowIndex = rowIndex + 2; // Add 2 to get the markdown row index
  
  console.log(`Converting data row ${rowIndex} to markdown row ${actualRowIndex}, table has ${table.rows.length} rows`);
  
  // Get the line number for the target row
  const targetLineNumber = table.rows[actualRowIndex];
  const targetLine = lines[targetLineNumber];
  
  console.log(`Target line: "${targetLine}"`);
  
  // Split the row into cells
  const cells = targetLine.split('|');
  
  // Remove the first and last empty cells (from the leading and trailing |)
  // Note: If the line starts or ends with |, the first/last elements will be empty strings
  const actualCells = cells.filter((_, index) => index > 0 && index < cells.length - 1);
  
  console.log(`Found ${actualCells.length} cells in row ${rowIndex}, target column: ${colIndex}`);
  
  // Make sure we use a valid column index
  const safeColIndex = Math.min(colIndex, actualCells.length - 1);
  
  // Check if we have the requested column
  if (safeColIndex >= actualCells.length) {
    console.error(`Column index ${colIndex} out of bounds (${actualCells.length} columns found)`);
    return markdown;
  }
  
  console.log(`Using column index ${safeColIndex} (requested ${colIndex}) out of ${actualCells.length} columns`);
  
  // Update the cell (preserve whitespace padding)
  const originalCell = actualCells[safeColIndex];
  const leadingSpaceMatch = originalCell.match(/^\s*/);
  const trailingSpaceMatch = originalCell.match(/\s*$/);
  const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
  const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';
  actualCells[safeColIndex] = `${leadingSpace}${newValue}${trailingSpace}`;
  
  // Reconstruct the row
  const newRow = `|${actualCells.join('|')}|`;
  
  console.log(`Updated row: "${newRow}"`);
  
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
          
          // Add table index to props so it can be passed down to child components
          const newProps = {
            ...props,
            'data-table-index': tableIndex
          };
          
          return <Table {...newProps}>{props.children}</Table>;
        },
        thead(props) {
          // Pass down the table index from parent
          return <TableHead {...props}>{props.children}</TableHead>;
        },
        tbody(props) {
          // Pass down the table index from parent
          return <TableBody {...props}>{props.children}</TableBody>;
        },
        tr(props) {
          // Get the parent table index from the closest ancestor
          // The data attribute should be properly passed down from the table component
          const tableIndex = props['data-table-index'] !== undefined ? props['data-table-index'] : 0;
          
          // Increment row counter for this table
          rowCounts.current[tableIndex] = (rowCounts.current[tableIndex] || 0) + 1;
          const rowIndex = rowCounts.current[tableIndex] - 1;
          
          // Initialize a column counter for this row
          colCounts.current[`${tableIndex}-${rowIndex}`] = 0;
          
          // Add table and row indices to props
          const newProps = {
            ...props,
            'data-table-index': tableIndex,
            'data-row-index': rowIndex
          };
          
          // We need to add column indices to each child
          const childrenWithProps = React.Children.map(props.children, child => {
            if (React.isValidElement(child)) {
              // Increment column index for this row
              const colIndex = colCounts.current[`${tableIndex}-${rowIndex}`]++;
              
              // Clone the child with the additional column index prop
              // Use a different approach to add data attributes to avoid TypeScript errors
              return React.cloneElement(child, {
                ...child.props,
                'data-table-index': tableIndex,
                'data-row-index': rowIndex,
                'data-col-index': colIndex
              } as React.HTMLAttributes<HTMLElement>);
            }
            return child;
          });
          
          return <TableRow {...newProps}>{childrenWithProps}</TableRow>;
        },
        th(props) {
          return <TableHeader {...props}>{props.children}</TableHeader>;
        },
        td(props) {
          // Extract children and other props
          const { children, ...rest } = props;
          
          // Get indices from props passed down via tr's childrenWithProps
          const tableIndex = props['data-table-index'] !== undefined ? props['data-table-index'] : 0;
          const rowIndex = props['data-row-index'] !== undefined ? props['data-row-index'] : 0;
          const colIndex = props['data-col-index'] !== undefined ? props['data-col-index'] : 0;
          
          // Row 0 = header, Row 1 = separator, Row 2+ = data rows (mapped to dataRow 0+)
          const isDataRow = rowIndex >= 2;
          // For data rows (index 2+), we subtract 2 to get the 0-based data row index
          // This converts UI row index to data row index (0-based)
          const dataRowIndex = isDataRow ? rowIndex - 2 : 0;
          
          console.log(`Cell at table=${tableIndex}, row=${dataRowIndex}, col=${colIndex}, content="${children}"`);
          
          // Handle cell edit for all cells
          const handleCellEdit = (tableIdx: number, rowIdx: number, colIdx: number, newValue: string) => {
            if (onCardUpdate) {
              // Log the data row index for debugging
              console.log(`Editing cell: table=${tableIdx}, row=${rowIdx}, col=${colIdx}, value="${newValue}"`);
              
              // IMPORTANT: For tables with multiple data rows, make sure we're editing the correct row
              // rowIdx is already the data row index (0-based, only counting data rows)
              // In our example of a table with header and 2 data rows:
              // rowIdx=0 should edit the first data row (markdown row 2)
              // rowIdx=1 should edit the second data row (markdown row 3)
              const updatedBody = updateTableCellInMarkdown(card.body, tableIdx, rowIdx, colIdx, newValue);
              onCardUpdate({
                ...card,
                body: updatedBody
              });
            }
          };
          
          // Only make data cells (not header/separator) editable
          return (
            <TableCell 
              {...rest} 
              tableIndex={tableIndex} 
              rowIndex={dataRowIndex} 
              colIndex={colIndex} 
              onCellEdit={isDataRow ? handleCellEdit : undefined}
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
