import React, { useEffect, createContext, useContext, useState } from "react";

import { fetchUserTags } from "../api/tags";
import { Tag } from "../models/Tags";

interface TagContextType {
  tags: Tag[];
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export const TagProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);

  const getTags = async () => {
    await fetchUserTags().then((data) => {
      console.log("tags1")
      console.log(data)
      setTags(data);
    });
  };

  useEffect(() => {
    console.log("???")
    getTags();
  }, []);
  return <TagContext.Provider value={{ tags }}>{children}</TagContext.Provider>;
};

export const useTagContext = () => {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error("useTagContext must be used wtihin a TagProvider");
  }
  return context;
};
