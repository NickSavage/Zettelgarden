import React, { useEffect, useState } from "react";
import { Task } from "../../models/Task";

interface TaskTagDisplayProps {
  task: Task;
  onTagClick: (tag: string) => void;
}

export function TaskTagDisplay({ task, onTagClick }: TaskTagDisplayProps) {
  const [tags, setTags] = useState<string[]>([]);

  function parseTags() {
    const tagPattern = /#[\w-]+/g;
    const matches = task.title.match(tagPattern);

    // If there are matches, return them. Otherwise, return an empty array.
    matches ? setTags(Array.from(matches) as string[]) : [];
  }

  useEffect(() => {
    parseTags();
  }, [task]);
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
