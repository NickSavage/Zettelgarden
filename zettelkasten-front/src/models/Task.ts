
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
  