import React from "react";

import { TaskListItem } from "./TaskListItem";
import { Task } from "../../models/Task";
import { useTaskContext } from "../../contexts/TaskContext";

interface TaskListProps {
  tasks: Task[];
  onTagClick: (tag: string) => void;
}

export function TaskList({ tasks, onTagClick }: TaskListProps) {
  const { setRefreshTasks } = useTaskContext();
  return (
    <ul>
      {tasks.map((task, index) => (
        <li key={task.id} className="p-0">
          <TaskListItem
            task={task}
            setRefresh={setRefreshTasks}
            onTagClick={onTagClick}
          />
        </li>
      ))}
    </ul>
  );
}
