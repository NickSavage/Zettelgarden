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
import { TaskViewOptionsMenu } from "../../components/tasks/TaskViewOptionsMenu";
import { Button } from "../../components/Button";

interface TaskListProps {}

export function TaskPage({}: TaskListProps) {
  const { tasks, setRefreshTasks } = useTaskContext();
  const [dateView, setDateView] = useState<string>("today");
  const [refresh, setRefresh] = useState<boolean>(true);
  const [showTaskWindow, setShowTaskWindow] = useState<boolean>(false);
  const [filterString, setFilterString] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
      setFilterString(e.target.value)
    }
  function filterTasks(task: Task) {
    if (filterString === "") {
      return task;
    }
    return task.title.toLowerCase().includes(filterString.toLowerCase());
  }

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setDateView(e.target.value);
  }
  function changeDateView(task: Task): boolean {
    if (dateView === "all") {
      if (!showCompleted && task.is_complete) {
        return false;
      } else {
        return true;
      }
    }
    if (dateView === "today") {
      if (!task.is_complete && isTodayOrPast(task.scheduled_date)) {
        return true;
      } else if (
        showCompleted &&
        compareDates(task.scheduled_date, getToday())
      ) {
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
      } else if (
        showCompleted &&
        compareDates(task.scheduled_date, getTomorrow())
      ) {
      } else {
        return false;
      }
    }

    return !task.is_complete;
  }
  function toggleShowTaskWindow() {
    setShowTaskWindow(!showTaskWindow);
  }


  function handleTagClick(tag: string) {
    setFilterString(tag)
    
  }
  useEffect(() => {
    document.title = "Zettelgarden - Tasks";
    //   setAllTasks();
  }, [refresh]);
  return (
    <div>
      <div className="bg-slate-200 p-2 border-slate-400 border">
        <div className="flex">
          <select value={dateView} onChange={handleDateChange}>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="all">All</option>
          </select>
	  <div className="mb-5 flex-grow">
	  <input type="text" value={filterString} onChange={handleFilterChange} placeholder="Filter" />
	  </div>
        <div className="flex-shrink">
          <TaskViewOptionsMenu
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
          />
        </div>
        </div>
        <Button onClick={toggleShowTaskWindow} children="Add Task" />
      </div>
      <div>
        {showTaskWindow && (
          <CreateTaskWindow
            currentCard={null}
            setRefresh={setRefreshTasks}
            setShowTaskWindow={setShowTaskWindow}
          />
        )}
      </div>
      <div className="p-4">
        <ul>
          {tasks && (
            <TaskList
	      onTagClick={handleTagClick}
              tasks={tasks
                ?.filter(changeDateView)
                .filter(filterTasks)
                .sort((a, b) => a.id - b.id)}
            />
          )}
        </ul>
      </div>
    </div>
  );
}
