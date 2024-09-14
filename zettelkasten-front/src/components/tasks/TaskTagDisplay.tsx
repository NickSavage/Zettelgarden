import React, { useEffect, useState } from "react";
import { Task } from "../../models/Task";
import { Tag } from "../../models/Tags";

interface TaskTagDisplayProps {
  task: Task;
  tags: Tag[];
  onTagClick: (tag: string) => void;
}

export function TaskTagDisplay({ task, tags, onTagClick }: TaskTagDisplayProps) {

  return (
    <span className="mr-1">
      {tags.length > 0 &&
        tags.map((tag) => (
          <span
            className="inline-block text-purple-500 text-xs px-2 cursor-pointer"
            onClick={() => onTagClick(tag.name)}
          >
            {tag.name}
          </span>
        ))}
    </span>
  );
}
