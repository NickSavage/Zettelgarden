import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Task } from "../../models/Task";
import { TaskDateDisplay } from "./TaskDateDisplay";
import { BacklinkInput } from "../cards/BacklinkInput";
import { PartialCard } from "../../models/Card";
import { Link } from "react-router-dom";
import { TaskTagDisplay } from "./TaskTagDisplay";
import { saveExistingTask, deleteTask } from "../../api/tasks";
import { useTaskContext } from "../../contexts/TaskContext";
import { Button } from "../../components/Button";
import { TaskListOptionsMenu } from "./TaskListOptionsMenu";

interface TaskDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTagClick: (tag: string) => void;
}

export function TaskDialog({ task, isOpen, onClose, onTagClick }: TaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [isEditing, setIsEditing] = useState(false);
  const [showCardLink, setShowCardLink] = useState<boolean>(false);
  const { setRefreshTasks } = useTaskContext();

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTask({ ...editedTask, title: e.target.value });
  };

  const handleSave = async () => {
    const response = await saveExistingTask(editedTask);
    if (!("error" in response)) {
      setRefreshTasks(true);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task? This cannot be undone.")) {
      await deleteTask(task.id);
      setRefreshTasks(true);
      onClose();
    }
  };

  const handleBacklink = async (card: PartialCard) => {
    const updatedTask = { ...editedTask, card_pk: card.id };
    const response = await saveExistingTask(updatedTask);
    if (!("error" in response)) {
      setEditedTask(updatedTask);
      setRefreshTasks(true);
      setShowCardLink(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
              Task Details
            </Dialog.Title>
            <TaskListOptionsMenu
              task={editedTask}
              tags={editedTask.tags}
              showCardLink={showCardLink}
              setShowCardLink={setShowCardLink}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  autoFocus
                />
              ) : (
                <div 
                  className="text-lg cursor-pointer hover:bg-gray-50 p-2 rounded flex-grow"
                  onClick={() => setIsEditing(true)}
                >
                  {editedTask.title}
                </div>
              )}
              {editedTask.card && editedTask.card.id > 0 && (
                <Link
                  to={`/app/card/${editedTask.card.id}`}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  style={{ textDecoration: "none" }}
                >
                  <span className="card-id">[{editedTask.card.card_id}]</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              <TaskDateDisplay
                task={editedTask}
                setTask={setEditedTask}
                saveOnChange={true}
              />
              <TaskTagDisplay task={editedTask} tags={editedTask.tags} onTagClick={onTagClick} />
            </div>

            {showCardLink && (
              <div className="border-t pt-4">
                <BacklinkInput addBacklink={handleBacklink} />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <Button 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Task
            </Button>
            <div className="flex gap-2">
              {isEditing && (
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              )}
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 