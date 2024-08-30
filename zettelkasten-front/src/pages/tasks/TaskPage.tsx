import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
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
import { Button } from "../../components/Button";

interface TaskListProps {}

export function TaskPage({}: TaskListProps) {
  const { tasks, setRefreshTasks } = useTaskContext();
  const [dateView, setDateView] = useState<string>("today");
  const [refresh, setRefresh] = useState<boolean>(true);
  const [showTaskWindow, setShowTaskWindow] = useState<boolean>(false);
  const [filterString, setFilterString] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState('Open');
  const openTasksCount = tasks.filter((task) => !task.is_complete).length;
  const closedTasksCount = tasks.filter((task) => task.is_complete).length;
  const allTasksCount = tasks.length;
  const tabs = [
    { label: 'Open', count: openTasksCount },
    { label: 'Closed', count: closedTasksCount },
    { label: 'All', count: allTasksCount },
  ];

  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setFilterString(e.target.value);
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
  // Handle filtering based on the active tab
  if (activeTab === "Open" && task.is_complete) {
    return false;
  }

  if (activeTab === "Closed" && !task.is_complete) {
    return false;
  }

  // Handle further filtering based on the date view
  if (dateView === "all") {
    // Only show completed tasks if the "Closed" tab is active
    if (!showCompleted && task.is_complete) {
      return false; 
    }
    return true;
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
    if (!task.is_complete && compareDates(task.scheduled_date, getTomorrow())) {
      return true;
    } else if (
      showCompleted &&
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

  function handleTagClick(tag: string) {
    setFilterString(tag);
  }

  function handleTabClick(label: string) {
    setActiveTab(label)
    if (label === "Closed") {
      setShowCompleted(true)
    } else {
      setShowCompleted(false)
    }
  }
  useEffect(() => {
    document.title = "Zettelgarden - Tasks";
    //   setAllTasks();
  }, [refresh]);
  return (
    <div>
    <div className="flex items-center space-x-4">
      {tabs.map((tab) => (
        <span
          key={tab.label}
          onClick={() => handleTabClick(tab.label)}
          className={`
            cursor-pointer font-medium py-1.5 px-3 rounded-md flex items-center
            ${activeTab === tab.label ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}
          `}
        >
          {tab.label} 
          <span className="ml-1 text-xs font-semibold bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
            {tab.count}
          </span>
        </span>
      ))}
    </div>
      <div className="bg-slate-200 p-2 border-slate-400 border">
        <div className="flex">
          <select className="mb-5" value={dateView} onChange={handleDateChange}>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="all">All</option>
          </select>
          <div className="mb-5 flex-grow">
            <input
              type="text"
              value={filterString}
              onChange={handleFilterChange}
              placeholder="Filter"
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
