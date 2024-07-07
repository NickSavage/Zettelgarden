import React, { useState, KeyboardEvent } from "react";
import { saveNewTask } from "src/api/tasks";

import { Task, emptyTask } from "src/models/Task";
import { PartialCard } from "src/models/Card";
import { BacklinkInput } from "../BacklinkInput";
import { TaskDateDisplay } from "./TaskDateDisplay";

interface CreateTaskWindowProps {
  cards: PartialCard[];
  setRefresh: (refresh: boolean) => void;
}

export function CreateTaskWindow({ cards, setRefresh }: CreateTaskWindowProps) {
  const [newTask, setNewTask] = useState<Task>(emptyTask);
  const [selectedCard, setSelectedCard] = useState<PartialCard | null>(null);
  async function handleSaveTask() {
    let response;

    console.log(newTask)
    response = await saveNewTask(newTask);
    if (!("error" in response)) {
      setRefresh(true);
      let date = newTask.scheduled_date
      setNewTask({ ...emptyTask, scheduled_date: date});
      setSelectedCard(null);
    }
  }
  function handleBacklink(card: PartialCard) {
    setSelectedCard(card);
    setNewTask({ ...newTask, card_pk: card.id });
  }

  return (
    <div className="create-task-window">
      <div className="create-task-window-top">
        <input
          style={{ width: "100%" }}
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              handleSaveTask();
            }
          }}
        />
      </div>
      <div className="create-task-window-bottom">
        <div className="create-task-window-bottom-left">
          <BacklinkInput cards={cards} addBacklink={handleBacklink} />
        </div>
        <div className="crate-task-window-bottom-middle">
          {selectedCard && (
            <span style={{ fontWeight: "bold", color: "blue" }}>
              [{selectedCard?.card_id}]
            </span>
          )}
          <TaskDateDisplay 
          task={newTask} 
          setTask={setNewTask}
          setRefresh={setRefresh}
          saveOnChange={false}
          />
        </div>
        <div className="create-task-window-bottom-right">
          <button onClick={handleSaveTask}>Save</button>
        </div>
      </div>
    </div>
  );
}
