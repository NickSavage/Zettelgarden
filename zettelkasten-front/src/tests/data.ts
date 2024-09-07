import { Task } from "../models/Task";

export function sampleTasks(): Task[] {
  return sampleTaskData;
}
const sampleTaskData: Task[] = [
  {
    id: 1,
    card_pk: 101,
    user_id: 1001,
    scheduled_date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
    dueDate: null, // Assuming dueDate is not provided in Swift data
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
    title: "Daily Standup Meeting #is #hi http://google.com",
    is_complete: false,
    is_deleted: false,
    card: null, // Or provide a mock PartialCard if needed
  },
  {
    id: 2,
    card_pk: 102,
    user_id: 1001,
    scheduled_date: new Date(), // Today
    dueDate: null,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
    title: "Weekly Sync-up #recurring",
    is_complete: false,
    is_deleted: false,
    card: null,
  },
  {

    id: 3,
    card_pk: 103,
    user_id: 1002,
    scheduled_date: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
    dueDate: null,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
    title: "Write Quarterly Report #report",
    is_complete: false,
    is_deleted: false,
    card: null,
  },
  {
    id: 4,
    card_pk: 104,
    user_id: 1003,
    scheduled_date: new Date(new Date().setDate(new Date().getDate() - 7)), // 7 days ago
    dueDate: null,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: new Date(), // Completed
    title: "Submit Expense Reports #task",
    is_complete: true,
    is_deleted: false,
    card: null,
  },
  {
    id: 5,
    card_pk: 105,
    user_id: 1004,
    scheduled_date: null, // No scheduled date
    dueDate: null,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
    title: "Brainstorm Session #work #todo",
    is_complete: false,
    is_deleted: false,
    card: null,
  },
];
