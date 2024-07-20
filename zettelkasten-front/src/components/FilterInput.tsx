import React, { useState, ChangeEvent } from "react";

interface FilterInputProps {
  handleFilterHook: (text: string) => void;
}

export function FilterInput({ handleFilterHook }: FilterInputProps) {
  const [filter, setFilter] = useState<string>("");
  function handleFilter(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFilter(e.target.value);
    handleFilterHook(e.target.value);
  }
  return (
    <input
      type="text"
      value={filter}
      onChange={handleFilter}
      placeholder="Filter"
    />
  );
}
