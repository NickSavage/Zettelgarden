import React, { useState, useEffect, ChangeEvent } from "react";
import { Task } from "../../models/Task";
import { TaskList } from "../../components/tasks/TaskList";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTaskContext } from "../../contexts/TaskContext";
import {
  compareDates,
  getToday,
  getTomorrow,
  isTodayOrPast,
} from "../../utils/dates";

interface TaskListProps {}

export function TaskPage({}: TaskListProps) {
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
        return false;
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
      if (
        !task.is_complete &&
        compareDates(task.scheduled_date, getTomorrow())
      ) {
        return true;
      } else {
        return false;
      }
    }

    return !task.is_complete;
  }
  function toggleShowTaskWindow() {
    setShowTaskWindow(!showTaskWindow);
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
            setRefresh={setRefreshTasks}
            setShowTaskWindow={setShowTaskWindow}
          />
        )}
      </div>
      <ul>
        {tasks && (
          <TaskList
            tasks={tasks?.filter(changeDateView).sort((a, b) => a.id - b.id)}
          />
        )}
      </ul>
    </div>
  );
}
