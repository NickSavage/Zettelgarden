import React, { useEffect, useState } from "react";
import { Task } from "src/models/Task";

import { compareDates, getToday, getTomorrow, getYesterday } from "src/utils";
import { saveExistingTask } from "src/api/tasks";

interface TaskDateDisplayProps {
  task: Task;
  setTask: (task: Task) => void;
  setRefresh: (refresh: boolean) => void;
  saveOnChange: boolean;
}

export function TaskDateDisplay({ task, setTask, setRefresh, saveOnChange }: TaskDateDisplayProps) {
  const [displayText, setDisplayText] = useState<string>("");

async function handleScheduledDateChange(e) {
    console.log("set date", e.target.valueAsDate)
    let date = new Date(e.target.valueAsDate)
    console.log("date", date)
    let editedTask = { ...task, scheduled_date: date };
    if (saveOnChange) {
      let response = await saveExistingTask(editedTask);
      if (!("error" in response)) {
        setRefresh(true);
      }
    } else {
      setTask(editedTask)
    }
}

  function updateDisplayText() {
    let isToday = compareDates(task.scheduled_date, getToday());
    let isTomorrow = compareDates(task.scheduled_date, getTomorrow());
    let isYesterday = compareDates(task.scheduled_date, getYesterday());
    if (isToday) {
      setDisplayText("Today");
    } else if (isTomorrow) {
      setDisplayText("Tomorrow");
    } else if (isYesterday) {
      setDisplayText("Yesterday");
    } else if (task.scheduled_date) {
      setDisplayText(task.scheduled_date.toLocaleDateString());
    }
  }
  useEffect(() => {
    updateDisplayText()
  }, [task]);

  return (
    <div>
      <div>{displayText}</div>
      <div>
        <input
          aria-label="Date"
          type="date"
          onChange={handleScheduledDateChange}
        />
      </div>
    </div>
  );
}
