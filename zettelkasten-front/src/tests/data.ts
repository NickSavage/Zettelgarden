import { Task } from "../models/Task";
import { Card, PartialCard } from "../models/Card";

export function sampleTasks(): Task[] {
  return sampleTaskData;
}
export function sampleCards(): Card[] {
  return sampleCardData;
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

const samplePartialCardData: PartialCard[] = [
    {
    id: 1,
    card_id: "1",
    user_id: 1,
    title: "hello world",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: 1,
    is_literature_card: false,
  },
  {
    id: 2,
    card_id: "1/A",
    user_id: 1,
    title: "update",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: 2,
    is_literature_card: false,
  },

]

const sampleCardData: Card[] = [
  {
    id: 1,
    card_id: "1",
    user_id: 1,
    title: "hello world",
    body: "this is a test of the emergency response system",
    link: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: 1,
    parent: samplePartialCardData[0],
    children: [],
    references: [],
    files: [],
    is_deleted: false,
    keywords: [],
    is_literature_card: false,
  },
  {
    id: 2,
    card_id: "1/A",
    user_id: 1,
    title: "update",
    body: "this is another test of the emergency response system",
    link: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: 2,
    parent: samplePartialCardData[1],
    children: [],
    references: [],
    files: [],
    is_deleted: false,
    keywords: [],
    is_literature_card: false,
  },
];
