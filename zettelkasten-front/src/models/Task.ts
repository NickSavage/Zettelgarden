
export interface Task {
    id: number;
    cardPK: number;
    userId: number;
    scheduled_date: Date | null;
    dueDate: Date | null;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
    title: string;
    is_complete: boolean;
    is_deleted: boolean;
  };
  
  export const emptyTask: Task = {
    id: -1,
    cardPK: -1,
    userId: -1,
    created_at: new Date(0),
    updated_at: new Date(0),
    dueDate: new Date(0),
    scheduled_date: new Date(0),
    completed_at: new Date(0),
    title: "",
    is_complete: false,
    is_deleted: false,
  }