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
import { EisenhowerMatrix } from "../../components/tasks/EisenhowerMatrix";

// import { SearchTagMenu } from "../../components/tags/SearchTagMenu"; // SearchTagMenu is not used
import { filterTasks } from "../../utils/tasks";

interface TaskListProps { }

type SortField = "updated_at" | "title" | "priority" | "id";
type SortDirection = "asc" | "desc";

export function TaskPage({ }: TaskListProps) {
  const { tasks, showCompleted } = useTaskContext(); // setRefreshTasks is not used
  const [dateView, setDateView] = useState<string>("today");
  const { showCreateTaskWindow, setShowCreateTaskWindow } =
    useShortcutContext();
  const [filterString, setFilterString] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilterHelp, setShowFilterHelp] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

  const { tags } = useTagContext();

  // changeDateView is used in useMemo, so it needs to be stable or part of dependencies.
  // Let's define it using useCallback or ensure it's stable if it doesn't depend on component state/props that change.
  // For now, assuming it's stable enough or will be correctly handled by useMemo's deps.
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
        task.scheduled_date && // Ensure scheduled_date is not null
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
        task.scheduled_date && // Ensure scheduled_date is not null
        compareDates(task.scheduled_date, getTomorrow())
      ) {
        return true;
      } else if (
        showCompleted &&
        task.scheduled_date && // Ensure scheduled_date is not null
        compareDates(task.scheduled_date, getTomorrow())
      ) {
        return true;
      } else {
        return false;
      }
    }
    // Fallback for other dateView values or if logic above doesn't return
    // This part of the original logic might need review: `return !task.is_complete;`
    // Assuming it's intended for a default case not covered by 'all', 'today', 'tomorrow'.
    // If dateView can only be these three, this line might be unreachable or imply specific behavior for other views.
    // For now, keeping it as is.
    return !task.is_complete;
  }

  const tasksToDisplay = useMemo(() => {
    if (viewMode === "matrix") {
      // In matrix mode, apply date filter first, then search
      let filteredByDate = tasks.filter(changeDateView);
      return filterTasks(filteredByDate, filterString);
    }
    let filtered = tasks.filter(changeDateView);
    let searched = filterTasks(filtered, filterString);

    searched.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "updated_at":
          comparison =
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
          break;
        case "title":
          comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
          break;
        case "priority":
          const prioA = a.priority;
          const prioB = b.priority;
          if (prioA === null && prioB === null) comparison = 0;
          else if (prioA === null) comparison = 1; // nulls last
          else if (prioB === null) comparison = -1; // nulls last
          else comparison = prioA.localeCompare(prioB);
          break;
        case "id":
          comparison = a.id - b.id;
          break;
        default:
          comparison = a.id - b.id; // Fallback to id
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return searched;
  }, [tasks, dateView, showCompleted, filterString, sortField, sortDirection]);

  const totalTasksForDateView = useMemo(() => {
    return tasks.filter(changeDateView).length;
  }, [tasks, dateView, showCompleted]);


  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, // Removed HTMLSelectElement as it's an input
  ) {
    setFilterString(e.target.value);
  }

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setDateView(e.target.value);
  }

  function handleSortFieldChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortField(e.target.value as SortField);
  }

  function toggleSortDirection() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
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
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [setShowCreateTaskWindow]); // Added setShowCreateTaskWindow to dependency array

  return (
    <div>
      <div className="bg-slate-200 p-2 border-slate-400 border">
        {/* Row 1: Date view, Filter input, & Sorting controls */}
        <div className="flex items-center gap-2 mb-3">
          <select className="p-1 border border-slate-400 rounded" value={dateView} onChange={handleDateChange}>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="all">All</option>
          </select>
          <div className="flex-grow relative flex items-center"> {/* Added relative and flex items-center */}
            <input
              type="text"
              value={filterString}
              onChange={handleFilterChange}
              placeholder="Filter tasks..."
              className="w-full p-1 border border-slate-400 rounded"
            />
            <span
              className="ml-2 cursor-pointer text-slate-500 hover:text-slate-700"
              onMouseEnter={() => setShowFilterHelp(true)}
              onMouseLeave={() => setShowFilterHelp(false)}
              aria-label="Filter help"
            >
              ?
            </span>
            {showFilterHelp && (
              <div className="absolute top-full mt-2 left-0 bg-white p-3 border border-slate-300 rounded shadow-lg z-20 w-auto min-w-[280px]">
                <h4 className="font-semibold mb-2 text-slate-700">Filter Options:</h4>
                <ul className="list-none space-y-1 text-sm text-slate-600">
                  <li><strong>Text:</strong> Searches task titles (e.g., <code>meeting</code>).</li>
                  <li><strong>Tag:</strong> <code>#tagName</code> (e.g., <code>#work</code>).</li>
                  <li><strong>Priority:</strong> <code>priority:A</code> (or B, C, etc.).</li>
                  <li><strong>Negate:</strong> Prepend <code>!</code> (e.g., <code>!#home</code>, <code>!priority:C</code>).</li>
                </ul>
              </div>
            )}
          </div>
          <select
            className="p-1 border border-slate-400 rounded"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "list" | "matrix")}
          >
            <option value="list">List View</option>
            <option value="matrix">Eisenhower Matrix</option>
          </select>
        </div>
        {/* Row 2: Action buttons (left) & Task count (right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={toggleShowTaskWindow} children="Add Task" />
            <TaskPageOptionsMenu
              tags={tags}
              handleTagClick={handleTagClick}
              tasks={tasksToDisplay}
            />
          </div>
          <span className="bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-sm">
            {tasksToDisplay.length}/{totalTasksForDateView} tasks
            {dateView === "today"
              ? " today"
              : dateView === "tomorrow"
                ? " tomorrow"
                : ""}
          </span>
          <label htmlFor="sort-select" className="text-sm font-medium whitespace-nowrap">Sort by:</label>
          <select
            id="sort-select"
            className="p-1 border border-slate-400 rounded"
            value={sortField}
            onChange={handleSortFieldChange}
          >
            <option value="updated_at">Date (Updated)</option>
            <option value="title">Name</option>
            <option value="priority">Priority</option>
            <option value="id">ID (Default)</option>
          </select>
          <Button onClick={toggleSortDirection} className="p-1">
            {sortDirection === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>
        </div>
      </div>
      <div>
        {showCreateTaskWindow && (
          <CreateTaskWindow
            currentCard={null}
            setShowTaskWindow={setShowCreateTaskWindow}
            currentFilter={filterString}
          />
        )}
      </div>
      <div className="p-4">
        {viewMode === "list" ? (
          <ul>
            {tasksToDisplay.length > 0 ? (
              <TaskList onTagClick={handleTagClick} tasks={tasksToDisplay} />
            ) : (
              <div className="flex justify-center items-center">
                No tasks, you're done for the day!
              </div>
            )}
          </ul>
        ) : (
          <EisenhowerMatrix onTagClick={handleTagClick} tasks={tasksToDisplay} />
        )}
      </div>
    </div>
  );
}
