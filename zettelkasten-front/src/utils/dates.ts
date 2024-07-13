import { Task } from "src/models/Task";

export function getToday(): Date {
  let result = new Date();
  return result;
}

export function getTomorrow(): Date {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
}

export function getYesterday(): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday;
}

export function compareDates(date1: Date | null, date2: Date | null): boolean {
  if (date1 === null || date2 === null) {
    return false;
  }
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function isTodayOrPast(date: Date | null): boolean {
  if (date === null) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day

  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0); // Set to the start of the day

  return inputDate <= today;
}

export function isPast(date: Date | null): boolean {
  if (date === null) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day

  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0); // Set to the start of the day

  return inputDate < today;
}

export function isRecurringTask(task: Task): boolean {
  const recurringPatterns = [
    /every day/i,
    /daily/i,
    /every \d+ days?/i,
    /weekly/i,
    /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /monthly/i,
    /yearly/i,
    /annually/i,
    // Add more patterns as needed
  ];

  return recurringPatterns.some((pattern) => pattern.test(task.title));
}
