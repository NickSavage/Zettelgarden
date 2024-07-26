import React from "react";
import { Button } from "./Button";

interface DatePickerProps {
  selectedDate: string;
  setNoDate: () => void;
  handleScheduledDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DatePicker({
  selectedDate,
  setNoDate,
  handleScheduledDateChange,
}: DatePickerProps) {
  return (
    <div>
      <Button onClick={setNoDate} size={"small"} children={"No Date"} />
      <input
        aria-label="Date"
        type="date"
        value={selectedDate}
        onChange={handleScheduledDateChange}
      />
    </div>
  );
}
