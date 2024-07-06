import React from "react";

import { Task } from "src/models/Task";

interface TaskListItemProps {
    task: Task;
}

export function TaskListItem({ task }: TaskListItemProps) {
    return (
        <div>
            <span>{task.title}</span>
        </div>
    )
}