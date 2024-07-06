import React, { useState, KeyboardEvent } from "react";
import { saveExistingTask } from "src/api/tasks";

import { Task } from "src/models/Task";

interface TaskListItemProps {
    task: Task;
    setRefresh: (refresh: boolean) => void;
}

export function TaskListItem({ task, setRefresh }: TaskListItemProps) {
    const [editTitle, setEditTitle] = useState<boolean>(false);
    const [newTitle, setNewTitle] = useState<string>("");
    console.log(task)

    async function handleTitleClick() {
        setNewTitle(task.title);
        setEditTitle(true);
    }

    async function handleTitleEdit() {
        let editedTask = { ...task, title: newTitle}
        let response = await saveExistingTask(editedTask)
        if (!("error" in response)) {
            setRefresh(true);
            setEditTitle(false);
            setNewTitle("");
        }
        
    }

    async function handleToggleComplete() {
        let editedTask = { ...task, is_complete: task.is_complete ? false : true}
        let response = await saveExistingTask(editedTask)
        if (!("error" in response)) {
            setRefresh(true);
        }
    }

    return (
        <div>
            <div>
                <span onClick={handleToggleComplete}>{task.is_complete ? "[x] - " : "[ ] - "}</span>
                {editTitle ? 
                <input
                  style={{ width: "100%" }}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                        handleTitleEdit();
                    }
                  }}
                /> :
                <span onClick={handleTitleClick} className={task.is_complete ? "task-completed" : ""}>{task.title}</span>}

            </div>
            <div>
            {task.card && task.card.id > 0 && (
                <span
                style={{ fontWeight: "bold", color: "blue" }}
                >[{task.card?.card_id}]</span>
            )}

            </div>

        </div>
    )
}