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
          <li>
	  <div className="w-full px-4 py-2 flex font-bold">
            <div className="flex-grow">Name</div>
            <div className="flex">
              <div className="px-2">Tasks</div>
              <div className="px-2">Cards</div>
            </div>
	    </div>
          </li>
          {tags &&
            tags.map((tag) => {
              return <TagListItem tag={tag} />;
            })}
        </ul>
      </div>
    </div>
  );
}
