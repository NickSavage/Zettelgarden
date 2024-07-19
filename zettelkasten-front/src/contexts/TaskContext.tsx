import React, { createContext, useState, useEffect, useContext } from "react";
import { Task } from "../models/Task";

import { fetchTasks } from "../api/tasks";

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskContextType {
    tasks: Task[];
    refreshTasks: boolean;
    setRefreshTasks: (refresh: boolean) => void;
    getTasks: () => Promise<void>;
  }
  

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshTasks, setRefreshTasks] = useState(false);
  
    const getTasks = async () => {
    await fetchTasks().then((data) => {
        console.log("asdas")
      setTasks(data);
      setRefreshTasks(false);
    });
  
}
    useEffect(() => {
      if (refreshTasks) {
        getTasks();
      }
    }, [refreshTasks]);
  
    return (
      <TaskContext.Provider value={{ tasks, refreshTasks, setRefreshTasks, getTasks }}>
        {children}
      </TaskContext.Provider>
    );
  };

  export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
      throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
  };