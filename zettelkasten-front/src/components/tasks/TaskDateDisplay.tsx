import React, { useEffect, useState } from "react";
import { Task } from "src/models/Task";

import { compareDates, getToday, getTomorrow, getYesterday } from "src/utils/dates";
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
    console.log("set date", e.target.value)
    let date = new Date(e.target.value)
    console.log("date", date)
    const localTimezoneOffset = date.getTimezoneOffset(); // Get the local timezone offset in minutes

// Adjust the date to UTC
    const utcDate = new Date(date.getTime() + localTimezoneOffset * 60000); // Convert offset to milliseconds
    let editedTask = { ...task, scheduled_date: utcDate };
    console.log(editedTask)
    if (saveOnChange) {
      let response = await saveExistingTask(editedTask);
      if (!("error" in response)) {
        setRefresh(true);
      }
    } else {
      setTask(editedTask)
    }
}
const getDisplayColor = () => {
  switch (displayText) {
    case "Today":
      return "green";
    case "Tomorrow":
      return "green";
    case "Yesterday":
      return "red";
    default:
      return "black";
  }
};


  function updateDisplayText() {
    if (task.scheduled_date === null) {
      setDisplayText("")
      return
    }
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
      <div style={{color: getDisplayColor()}}>{displayText}</div>
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
