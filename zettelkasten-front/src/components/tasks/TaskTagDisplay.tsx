import React, { useEffect, useState } from "react";
import { Task } from "../../models/Task";

interface TaskTagDisplayProps {
  task: Task;
  tags: string[];
  onTagClick: (tag: string) => void;
}

export function TaskTagDisplay({ task, tags, onTagClick }: TaskTagDisplayProps) {

  return (
    <span className="mr-1">
      {tags.length > 0 &&
        tags.map((tag) => (
          <span
            className="inline-block text-purple-500 text-xs px-2 cursor-pointer"
            onClick={() => onTagClick(tag)}
          >
            {tag}
          </span>
        ))}
    </span>
  );
}
