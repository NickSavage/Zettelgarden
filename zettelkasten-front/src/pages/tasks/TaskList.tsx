import React, { useState, useEffect, ChangeEvent } from "react";
import { Task } from "src/models/Task";
import { TaskListItem } from "src/components/tasks/TaskListItem";
import { CreateTaskWindow } from "src/components/tasks/CreateTaskWindow";
import { PartialCard } from "src/models/Card";
import { useTaskContext } from "src/contexts/TaskContext";
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
  const { tasks, setRefreshTasks } = useTaskContext();
  const [dateView, setDateView] = useState<string>("today");
  const [refresh, setRefresh] = useState<boolean>(true);
  const [showTaskWindow, setShowTaskWindow] = useState<boolean>(false);

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setDateView(e.target.value);
  }
  function changeDateView(task: Task): boolean {
    if (dateView === "closedToday") {
      console.log("?");
      if (compareDates(task.completed_at, getToday()) && task.is_complete) {
        return true;
      } else {
        return false;
      }
    }
    if (dateView === "allClosed") {
      if (task.is_complete) {
        return true;
      } else {
        return false;
      }
    }
    if (dateView === "all") {
      if (task.is_complete) {
        return false
      } else {
        return true;
      }
    }  
       if (dateView === "today") {
      if (!task.is_complete && isTodayOrPast(task.scheduled_date)) {
        return true;
      } else {
        return false;
      }
    }
    if (dateView === "tomorrow") {
      if (!task.is_complete && compareDates(task.scheduled_date, getTomorrow())) {
        return true;
      } else {
        return false;
      }
    }

    return !task.is_complete;
  }
  function toggleShowTaskWindow() {
    setShowTaskWindow(!showTaskWindow)
  }
  useEffect(() => {
    document.title = "Zettelgarden - Tasks";
 //   setAllTasks();
  }, [refresh]);
  return (
    <div>
      <div>
        <select value={dateView} onChange={handleDateChange}>
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
          setRefresh={setRefreshTasks}
          setShowTaskWindow={setShowTaskWindow}
        />)}
      </div>
      <ul>
        {tasks
          ?.filter(changeDateView)
          .sort((a, b) => a.id - b.id)
          .map((task, index) => (
            <li key={index}>
              <TaskListItem cards={cards} task={task} setRefresh={setRefreshTasks} />
            </li>
          ))}
      </ul>
    </div>
  );
}
