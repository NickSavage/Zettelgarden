import React from "react";
import { useTagContext } from "../../contexts/TagContext";

interface TagListInterface {}

export function TagList({}: TagListInterface) {
  const { tags } = useTagContext();
  return (
    <div className="pt-4">
      <div>
        {tags &&
          tags.map((tag) => {
            return (
              <li>
                <div className="w-full py-2 px-4 flex">
                  <div className="flex-grow">{tag.name}</div>
                  <div className="aoeao">Remove</div>
                </div>
              </li>
            );
          })}
      </div>
    </div>
  );
}
