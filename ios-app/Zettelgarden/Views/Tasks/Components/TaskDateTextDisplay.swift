//
//  TaskDateTextDisplay.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-14.
//

import SwiftUI
import ZettelgardenShared

struct TaskDateTextDisplay: View {
    @ObservedObject var taskViewModel: TaskViewModel

    func isRecurringTask(task: ZTask) -> Bool {
        let recurringPatterns = [
            "every day",
            "daily",
            "every \\d+ days?",
            "weekly",
            "every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
            "monthly",
            "yearly",
            "annually",
            // Add more patterns as needed
        ]

        return recurringPatterns.contains { pattern in
            task.title.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
        }
    }
    var body: some View {
        if let task = taskViewModel.task {
            if let date = task.scheduled_date {
                if isToday(maybeDate: date) {
                    Text("Today")
                        .font(.caption)
                        .foregroundColor(.green)
                }
                else if !task.is_complete && isPast(maybeDate: date) {
                    Text(date, style: .date)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                else {
                    Text(date, style: .date).font(.caption)
                }
            }
            else {
                Text("No Date").font(.caption)
            }
            if isRecurringTask(task: task) {
                Text("Recurring")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
    }
}
