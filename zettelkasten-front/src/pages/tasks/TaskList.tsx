import React, { useState, useEffect, ChangeEvent } from "react";
import { Task } from "src/models/Task";
import { fetchTasks } from "src/api/tasks";
import { TaskListItem } from "src/components/tasks/TaskListItem";
import { CreateTaskWindow } from "src/components/tasks/CreateTaskWindow";
import { PartialCard } from "src/models/Card";
import {
  compareDates,
  getToday,
  getTomorrow,
  isTodayOrPast,
} from "src/utils/dates";

interface TaskListProps {
  cards: PartialCard[];
}

export function TaskList({ cards }: TaskListProps) {
  const [filterDate, setFilterDate] = useState<string>("today");
  const [refresh, setRefresh] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[] | null>([]);
  const [showTaskWindow, setShowTaskWindow] = useState<boolean>(false);

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setFilterDate(e.target.value);
  }
  function filterTasks(task: Task): boolean {
    if (filterDate === "closedToday") {
      console.log("?");
      if (compareDates(task.completed_at, getToday()) && task.is_complete) {
        return true;
      } else {
        return false;
      }
    }
    if (filterDate === "allClosed") {
      if (task.is_complete) {
        return true;
      } else {
        return false;
      }
    }
    if (filterDate === "all") {
      if (task.is_complete) {
        return false
      } else {
        return true;
      }
    }  
       if (filterDate === "today") {
      if (!task.is_complete && isTodayOrPast(task.scheduled_date)) {
        return true;
      } else {
        return false;
      }
    }
    if (filterDate === "tomorrow") {
      if (!task.is_complete && compareDates(task.scheduled_date, getTomorrow())) {
        return true;
      } else {
        return false;
      }
    }

    return !task.is_complete;
  }
  async function setAllTasks() {
    if (!refresh) {
      return;
    }
    await fetchTasks().then((data) => {
      setTasks(data);
      setRefresh(false);
    });
  }
  function toggleShowTaskWindow() {
    setShowTaskWindow(!showTaskWindow)
  }
  useEffect(() => {
    document.title = "Zettelgarden - Tasks";
    setAllTasks();
  }, [refresh]);
  return (
    <div>
      <div>
        <select value={filterDate} onChange={handleDateChange}>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="closedToday">Closed Today</option>
          <option value="all">All</option>
          <option value="allClosed">All Closed</option>
        </select>
      </div>
      <span onClick={toggleShowTaskWindow}>Add Task</span>
      <div>
        {showTaskWindow && (
        <CreateTaskWindow
          currentCard={null}
          cards={cards}
          setRefresh={setRefresh}
          setShowTaskWindow={setShowTaskWindow}
        />)}
      </div>
      <ul>
        {tasks
          ?.filter(filterTasks)
          .sort((a, b) => a.id - b.id)
          .map((task, index) => (
            <li key={index}>
              <TaskListItem cards={cards} task={task} setRefresh={setRefresh} />
            </li>
          ))}
      </ul>
    </div>
  );
}
