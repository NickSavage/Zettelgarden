import React, { createContext, useState, useEffect, useContext } from "react";
import { Task } from "../models/Task";

import { fetchTasks } from "../api/tasks";

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskContextType {
  tasks: Task[];
  refreshTasks: boolean;
  setRefreshTasks: (refresh: boolean) => void;
  getTasks: () => Promise<void>;
  existingTags: string[];
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const extractTags = async (data: Task[]) => {
    let tagSet = new Set<string>();

    data.forEach((task) => {
      const tagsInTitle = task.title.match(/\b#\w+\b/g);

      if (tagsInTitle) {
        tagsInTitle.forEach((tag) => tagSet.add(tag));
      }
    });

    setExistingTags(Array.from(tagSet));
  };
  const getTasks = async () => {
    console.log("run getTasks");
    await fetchTasks().then((data) => {
      console.log("asdas");
      setTasks(data);
      extractTags(data);
      setRefreshTasks(false);
    });
  };
  useEffect(() => {
    if (refreshTasks) {
      getTasks();
    }
    const intervalId = setInterval(() => {
      getTasks();
    }, 15000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [refreshTasks]);

  return (
    <TaskContext.Provider
      value={{ tasks, refreshTasks, setRefreshTasks, getTasks, existingTags }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
