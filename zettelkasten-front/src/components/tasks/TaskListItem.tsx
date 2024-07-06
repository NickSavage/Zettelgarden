import React from "react";

import { Task } from "src/models/Task";

interface TaskListItemProps {
    task: Task;
}

export function TaskListItem({ task }: TaskListItemProps) {
    console.log(task)
    return (
        <div>
            <div>
            <span className={task.is_complete ? "task-completed" : ""}>{task.title}</span>

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