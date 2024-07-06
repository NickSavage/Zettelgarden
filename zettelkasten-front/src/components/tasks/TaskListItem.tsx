import React from "react";

import { Task } from "src/models/Task";

interface TaskListItemProps {
    task: Task;
}

export function TaskListItem({ task }: TaskListItemProps) {
    console.log(task)
    return (
        <div>
            <span className={task.is_complete ? "task-completed" : ""}>{task.title}</span>
        </div>
    )
}