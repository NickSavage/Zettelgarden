import React, { useState, KeyboardEvent } from "react";
import { saveExistingTask } from "src/api/tasks";

import { TaskDateDisplay } from "./TaskDateDisplay";
import { Task } from "src/models/Task";

interface TaskListItemProps {
  task: Task;
  setRefresh: (refresh: boolean) => void;
}

export function TaskListItem({ task, setRefresh }: TaskListItemProps) {
  const [editTitle, setEditTitle] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");

  async function handleTitleClick() {
    setNewTitle(task.title);
    setEditTitle(true);
  }

  async function handleTitleEdit() {
    let editedTask = { ...task, title: newTitle };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
      setEditTitle(false);
      setNewTitle("");
    }
  }

  async function handleToggleComplete() {
    let editedTask = { ...task, is_complete: task.is_complete ? false : true };
    let response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefresh(true);
    }
  }
  return (
    <div className="task-list-item">
      <div className="task-list-item-checkbox">
        <span onClick={handleToggleComplete}>
          {task.is_complete ? "[x]" : "[ ]"}
        </span>
      </div>
      <div className="task-list-item-middle-container">
        <div className="task-list-item-title">
          {editTitle ? (
            <input
              className="task-list-item-title-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  handleTitleEdit();
                }
              }}
            />
          ) : (
            <span
              onClick={handleTitleClick}
              className={task.is_complete ? "task-completed" : "task-title"}
            >
              {task.title}
            </span>
          )}
        </div>
        <div className="task-list-item-details">
          <TaskDateDisplay
            task={task}
            setTask={(task: Task) => {}}
            setRefresh={setRefresh}
            saveOnChange={true}
          />
        </div>
      </div>
      <div className="task-list-item-card">
        {task.card && task.card.id > 0 && (
          <span className="card-id">[{task.card.card_id}]</span>
        )}
      </div>
    </div>
  );
}
