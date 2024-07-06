
export interface Task {
    id: number;
    cardPK: number;
    userId: number;
    scheduledDate: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    title: string;
    isComplete: boolean;
    isDeleted: boolean;
  };
  
  export const emptyTask: Task = {
    id: -1,
    cardPK: -1,
    userId: -1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    dueDate: new Date(0),
    scheduledDate: new Date(0),
    completedAt: new Date(0),
    title: "",
    isComplete: false,
    isDeleted: false,
  }