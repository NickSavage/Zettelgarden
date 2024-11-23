import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { Task } from "../../models/Task";
import { TaskList } from "../../components/tasks/TaskList";
import { TaskPageOptionsMenu } from "../../components/tasks/TaskPageOptionsMenu";
import { CreateTaskWindow } from "../../components/tasks/CreateTaskWindow";
import { useTaskContext } from "../../contexts/TaskContext";
import { useTagContext } from "../../contexts/TagContext";

import {
  compareDates,
  getToday,
  getTomorrow,
  isTodayOrPast,
} from "../../utils/dates";
import { Button } from "../../components/Button";
import { useShortcutContext } from "../../contexts/ShortcutContext";

import { SearchTagMenu } from "../../components/tags/SearchTagMenu";
import { filterTasks } from "../../utils/tasks";

interface TaskListProps {}

export function TaskPage({}: TaskListProps) {
  const { tasks, setRefreshTasks, showCompleted } = useTaskContext();
  const [dateView, setDateView] = useState<string>("today");
  const { showCreateTaskWindow, setShowCreateTaskWindow } =
    useShortcutContext();
  const [filterString, setFilterString] = useState<string>("");

  const { tags } = useTagContext();

  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setFilterString(e.target.value);
  }

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setDateView(e.target.value);
  }
  function changeDateView(task: Task): boolean {
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
      if (
        !task.is_complete &&
        compareDates(task.scheduled_date, getTomorrow())
      ) {
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
    setShowCreateTaskWindow(!showCreateTaskWindow);
  }

  function handleTagClick(tag: string) {
    setFilterString("#" + tag);
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    // if this is true, the user is using a system shortcut, don't do anything with it
    if (event.metaKey) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setShowCreateTaskWindow(false);
      return;
    }
  };

  useEffect(() => {
    document.title = "Zettelgarden - Tasks";

    const params = new URLSearchParams(location.search);
    const term = params.get("term");
    if (term) {
      setFilterString(term);
      //    handleSearch(term);
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);
  return (
    <div>
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
        <div className="flex">
          <Button onClick={toggleShowTaskWindow} children="Add Task" />

          <SearchTagMenu
            tags={tags.filter((tag) => tag.task_count > 0)}
            handleTagClick={handleTagClick}
          />
          <TaskPageOptionsMenu />
        </div>
      </div>
      <div>
        {showCreateTaskWindow && (
          <CreateTaskWindow
            currentCard={null}
            setRefresh={setRefreshTasks}
            setShowTaskWindow={setShowCreateTaskWindow}
            currentFilter={filterString}
          />
        )}
      </div>
      <div className="p-4">
        <ul>
          {tasks && (
            <TaskList
              onTagClick={handleTagClick}
              tasks={filterTasks(
                tasks.filter(changeDateView),
                filterString,
              ).sort((a, b) => a.id - b.id)}
            />
          )}
        </ul>
      </div>
    </div>
  );
}
