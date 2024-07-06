
import { CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH } from "next/dist/shared/lib/constants";
import React, { useState } from "react";
import { saveNewTask } from "src/api/tasks";

import { Task, emptyTask } from "src/models/Task";

interface CreateTaskWindowProps {
    setRefresh: (boolean) => void;
}

export function CreateTaskWindow({setRefresh}: CreateTaskWindowProps) {
    const [newTask, setNewTask] = useState<Task>(emptyTask);
    async function handleSaveTask() {
        let response;

        response = await saveNewTask(newTask);
        if (!("error" in response)) {
            setRefresh(true);
            setNewTask(emptyTask);
        }
    }

    return (
        <div>
            <input 
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value})
              }
            />
            <button onClick={handleSaveTask}>Save</button>
        </div>
    )
}