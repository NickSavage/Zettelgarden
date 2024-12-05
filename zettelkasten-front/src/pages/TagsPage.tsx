
import React, { useState, useEffect, ChangeEvent, useMemo } from "react";

import { TagList } from "../components/tags/TagList";

interface TagsListProps {}

export function TagsPage({}: TagsListProps) {
  return (
    <div>
          <TagList />
    </div>
  )
}
