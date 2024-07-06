
import React, { useState, KeyboardEvent } from "react";
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
        <div style={{display: "flex", marginBottom: "10px"}}>
            <input 
              style={{ width: "100%"}}
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value})
              }
        onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter") {
            handleSaveTask();
          }
        }}
            />
            <button onClick={handleSaveTask}>Save</button>
        </div>
    )
}