import React, { useState, useEffect } from "react";
import { Task } from "src/models/Task";
import { fetchTasks } from "src/api/tasks";
import { TaskListItem } from "src/components/tasks/TaskListItem";
import { CreateTaskWindow } from "src/components/tasks/CreateTaskWindow";

interface TaskListProps {
}

export function TaskList({}: TaskListProps) {
        
    const [refresh, setRefresh] = useState<boolean>(true);
    const [tasks, setTasks] = useState<Task[] | null>([]);

    async function setAllTasks() {
        if (!refresh) {
            return;
        } 
        await fetchTasks().then((data) => {
            setTasks(data);
            setRefresh(false);
        })

    }
    useEffect(() => {setAllTasks()}, [refresh])
    return (
        <div>
            <CreateTaskWindow setRefresh={setRefresh} />
            <ul>
            {tasks?.map((task, index) => (
                <li key={index}>
                    <TaskListItem task={task} />
                </li>
            ))}
            </ul>
        </div>
    )
}