import React from "react";
import { useTagContext } from "../../contexts/TagContext";
import { TagListItem } from "./TagListItem";

interface TagListInterface {}

export function TagList({}: TagListInterface) {
  const { tags } = useTagContext();

  return (
    <div className="pt-4">
      <span className="text-lg font-bold align-center">Tags</span>
      <div>
        <ul>
          {tags &&
            tags.map((tag) => {
              return <TagListItem tag={tag} />;
            })}
        </ul>
      </div>
    </div>
  );
}
