import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Task, TaskAuditEvent } from "../../models/Task";
import { TaskDateDisplay } from "./TaskDateDisplay";
import { BacklinkInput } from "../cards/BacklinkInput";
import { PartialCard } from "../../models/Card";
import { Link } from "react-router-dom";
import { TaskTagDisplay } from "./TaskTagDisplay";
import { saveExistingTask, deleteTask, fetchTaskAuditEvents } from "../../api/tasks";
import { useTaskContext } from "../../contexts/TaskContext";
import { Button } from "../../components/Button";
import { TaskListOptionsMenu } from "./TaskListOptionsMenu";
import { format } from "date-fns";

interface TaskDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTagClick: (tag: string) => void;
}

function formatAuditEvent(event: TaskAuditEvent): string {
  console.log("Formatting event:", event);

  if (event.action === "create") {
    return "Task created";
  }
  
  if (event.action === "delete") {
    return "Task deleted";
  }

  if (event.action === "update" && event.details.change_type === "update") {
    const changes: string[] = [];
    const changeDetails = event.details.changes;

    // Title changes
    if (changeDetails.Title) {
      changes.push(`Changed title from "${changeDetails.Title.from}" to "${changeDetails.Title.to}"`);
    }

    // Completion status changes
    if (changeDetails.IsComplete) {
      changes.push(changeDetails.IsComplete.to ? "Marked as complete" : "Marked as incomplete");
    }

    // Scheduled date changes
    if (changeDetails.ScheduledDate) {
      const newDate = changeDetails.ScheduledDate.to ? 
        format(new Date(changeDetails.ScheduledDate.to), 'MMM d, yyyy') : 
        'none';
      changes.push(`Changed scheduled date to ${newDate}`);
    }

    // Card link changes
    if (changeDetails.CardPK) {
      if (changeDetails.CardPK.from === 0 && changeDetails.CardPK.to > 0) {
        changes.push(`Linked to card [${changeDetails.CardPK.to}]`);
      } else if (changeDetails.CardPK.from > 0 && changeDetails.CardPK.to === 0) {
        changes.push(`Unlinked from card [${changeDetails.CardPK.from}]`);
      } else {
        changes.push(`Changed linked card from [${changeDetails.CardPK.from}] to [${changeDetails.CardPK.to}]`);
      }
    }

    // If no specific changes were detected
    if (changes.length === 0) {
      return "Task updated";
    }

    return changes.join("; ");
  }

  return "Unknown change";
}

export function TaskDialog({ task, isOpen, onClose, onTagClick }: TaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [isEditing, setIsEditing] = useState(false);
  const [showCardLink, setShowCardLink] = useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<TaskAuditEvent[]>([]);
  const { setRefreshTasks } = useTaskContext();

  useEffect(() => {
    setEditedTask(task);
    if (task.id) {
      fetchTaskAuditEvents(task.id)
        .then(events => setAuditEvents(events))
        .catch(error => console.error("Error fetching audit events:", error));
    }
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

          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task History</h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {auditEvents.length > 0 ? (
                auditEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 text-sm hover:bg-gray-50 p-2 rounded">
                    <div className="text-gray-500 min-w-[120px] font-medium">
                      {format(event.created_at, 'MMM d, HH:mm')}
                    </div>
                    <div className="flex-grow text-gray-700">
                      {formatAuditEvent(event)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No history available
                </div>
              )}
            </div>
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