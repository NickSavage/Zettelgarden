import React, { useState, useEffect, ChangeEvent } from "react";
import { Task } from "src/models/Task";
import { fetchTasks } from "src/api/tasks";
import { TaskListItem } from "src/components/tasks/TaskListItem";
import { CreateTaskWindow } from "src/components/tasks/CreateTaskWindow";
import { PartialCard } from "src/models/Card";
import { compareDates, getTomorrow, isTodayOrPast } from "src/utils/dates";

interface TaskListProps {
  cards: PartialCard[];
}

export function TaskList({ cards }: TaskListProps) {
  const [filterDate, setFilterDate] = useState<string>("today");
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [refresh, setRefresh] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[] | null>([]);

  function handleDateChange(e: ChangeEvent<HTMLSelectElement>) {
    setFilterDate(e.target.value);
  }
  function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    setFilterStatus(e.target.value);
  }
  function filterTasks(task: Task): boolean {
    if (filterStatus === "all") {
      return true;
    } else {
      if (task.is_complete) {
        return false;
      }
    }
    if (filterDate === "today") {
      if (isTodayOrPast(task.scheduled_date)) {
        return true;
      } else {
        return false;
      }
    }
    if (filterDate === "tomorrow") {
      if (compareDates(task.scheduled_date, getTomorrow())) {
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
          <option value="all">All</option>
        </select>
        <select value={filterStatus} onChange={handleStatusChange}>
          <option value="open">Open</option>
          <option value="all">All</option>
        </select>
      </div>
      <div>
        <CreateTaskWindow
          currentCard={null}
          cards={cards}
          setRefresh={setRefresh}
        />
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
