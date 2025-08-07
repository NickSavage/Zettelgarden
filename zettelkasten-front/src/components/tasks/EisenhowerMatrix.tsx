import React from "react";
import { Task } from "../../models/Task";
import { TaskList } from "./TaskList";

interface EisenhowerMatrixProps {
    tasks: Task[];
    onTagClick: (tag: string) => void;
}

function getQuadrant(task: Task): 1 | 2 | 3 | 4 {
    const tags = (task.tags || []).map((t: any) =>
        typeof t === "string" ? t.toLowerCase() : (t && t.name ? String(t.name).toLowerCase() : "")
    );
    const isImportant = tags.includes("important");
    const isUrgent = tags.includes("urgent");

    if (isImportant && isUrgent) return 1;
    if (isImportant && !isUrgent) return 2;
    if (!isImportant && isUrgent) return 3;
    return 4; // default quadrant if no labels or both false
}

export function EisenhowerMatrix({ tasks, onTagClick }: EisenhowerMatrixProps) {
    const q1 = tasks.filter(t => getQuadrant(t) === 1);
    const q2 = tasks.filter(t => getQuadrant(t) === 2);
    const q3 = tasks.filter(t => getQuadrant(t) === 3);
    const q4 = tasks.filter(t => getQuadrant(t) === 4);

    const quadrantBox = (title: string, quadrantTasks: Task[]) => (
        <div className="border border-slate-400 p-2 rounded bg-white">
            <h3 className="font-bold mb-2">{title} ({quadrantTasks.length})</h3>
            {quadrantTasks.length > 0 ? (
                <TaskList onTagClick={onTagClick} tasks={quadrantTasks} />
            ) : (
                <div className="text-slate-500 text-sm">No tasks</div>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-4">
            {quadrantBox("Q1: Do First (Important & Urgent)", q1)}
            {quadrantBox("Q2: Schedule (Important, Not Urgent)", q2)}
            {quadrantBox("Q3: Delegate (Not Important, Urgent)", q3)}
            {quadrantBox("Q4: Eliminate (Not Important, Not Urgent)", q4)}
        </div>
    );
}
