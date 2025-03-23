import React from "react";
import { Button } from "../Button";

interface MarkdownToolbarProps {
  onFormatText: (formatType: string) => void;
  onBacklinkClick: () => void;
}

export function MarkdownToolbar({ onFormatText, onBacklinkClick }: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <div className="flex space-x-1">
        <Button 
          onClick={() => onFormatText('bold')} 
          variant="secondary" 
          size="small"
          className="font-bold"
        >
          B
        </Button>
        <Button 
          onClick={() => onFormatText('italic')} 
          variant="secondary" 
          size="small"
          className="italic"
        >
          I
        </Button>
      </div>

      <div className="flex space-x-1">
        <Button 
          onClick={() => onFormatText('h1')} 
          variant="secondary" 
          size="small"
        >
          H1
        </Button>
        <Button 
          onClick={() => onFormatText('h2')} 
          variant="secondary" 
          size="small"
        >
          H2
        </Button>
        <Button 
          onClick={() => onFormatText('h3')} 
          variant="secondary" 
          size="small"
        >
          H3
        </Button>
      </div>

      <div className="flex space-x-1">
        <Button 
          onClick={() => onFormatText('bulletList')} 
          variant="secondary" 
          size="small"
        >
          • List
        </Button>
        <Button 
          onClick={() => onFormatText('numberList')} 
          variant="secondary" 
          size="small"
        >
          1. List
        </Button>
      </div>

      <div className="flex space-x-1">
        <Button 
          onClick={() => onFormatText('code')} 
          variant="secondary" 
          size="small"
          className="font-mono"
        >
          Code
        </Button>
        <Button 
          onClick={() => onFormatText('quote')} 
          variant="secondary" 
          size="small"
        >
          Quote
        </Button>
        <Button 
          onClick={onBacklinkClick} 
          variant="secondary" 
          size="small"
        >
          Backlink
        </Button>
      </div>
    </div>
  );
}
