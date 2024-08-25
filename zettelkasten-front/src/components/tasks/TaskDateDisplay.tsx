import React, { useEffect, useState } from "react";
import { Task } from "../../models/Task";

import {
  compareDates,
  getToday,
  getTomorrow,
  getYesterday,
  isPast,
  isRecurringTask,
} from "../../utils/dates";
import { saveExistingTask } from "../../api/tasks";
import { DatePicker } from "../DatePicker";

interface TaskDateDisplayProps {
  task: Task;
  setTask: (task: Task) => void;
  setRefresh: (refresh: boolean) => void;
  saveOnChange: boolean;
}

export function TaskDateDisplay({
  task,
  setTask,
  setRefresh,
  saveOnChange,
}: TaskDateDisplayProps) {
  const [displayText, setDisplayText] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    task.scheduled_date ? task.scheduled_date.toISOString().substr(0, 10) : ""
  );
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);

  async function updateTask(editedTask: Task) {
    if (saveOnChange) {
      let response = await saveExistingTask(editedTask);
      if (!("error" in response)) {
        setRefresh(true);
      }
    } else {
      setTask(editedTask);
    }
  }

  async function setNoDate() {
    let editedTask = { ...task, scheduled_date: null };
    updateTask(editedTask);
    setDisplayDatePicker(false);
    setSelectedDate("");
  }

  async function handleScheduledDateChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    console.log(e);
    const newDate = new Date(e.target.value);
    const localTimezoneOffset = newDate.getTimezoneOffset();
    const utcDate = new Date(newDate.getTime() + localTimezoneOffset * 60000);

    setSelectedDate(newDate.toISOString().substr(0, 10)); // Update selected date in the state
    let editedTask = { ...task, scheduled_date: utcDate };

    updateTask(editedTask);

    setDisplayDatePicker(false);
    setSelectedDate("");
  }

  const getDisplayColor = () => {
    if (!task.is_complete && isPast(task.scheduled_date)) {
      return "red";
    }
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

  function handleTextClick() {
    setDisplayDatePicker(!displayDatePicker);
  }

  function updateDisplayText() {
    if (task.scheduled_date === null) {
      setDisplayText("No Date");
      return;
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
    updateDisplayText();
  }, [task]);

  return (
    <div>
      <div
        onClick={handleTextClick}
        className="task-date mr-1"
        style={{ color: getDisplayColor() }}
      >
        {displayText}
        {isRecurringTask(task) && (
          <>
            <span> - </span>
            <span className="task-recurring">Recurring</span>
          </>
        )}
      </div>
      <div>
        {displayDatePicker && (
          <DatePicker
            selectedDate={selectedDate}
            setNoDate={setNoDate}
            handleScheduledDateChange={handleScheduledDateChange}
          />
        )}
      </div>
    </div>
  );
}
