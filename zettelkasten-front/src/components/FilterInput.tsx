import React, { useState, ChangeEvent, InputHTMLAttributes } from "react";

interface FilterInputProps extends InputHTMLAttributes<HTMLInputElement> {
  handleFilterHook: (text: string) => void;
}

export function FilterInput({ handleFilterHook, ...props }: FilterInputProps) {
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
      {...props}
    />
  );
}
