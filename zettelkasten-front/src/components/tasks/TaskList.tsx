import React from "react";

import { TaskListItem } from "./TaskListItem";
import { Task } from "../../models/Task";
import { useTaskContext } from "../../contexts/TaskContext";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const { setRefreshTasks } = useTaskContext();
  return (
    <ul>
      {tasks.map((task, index) => (
        <li key={task.id} className="p-0">
          <TaskListItem task={task} setRefresh={setRefreshTasks} />
        </li>
      ))}
    </ul>
  );
}
