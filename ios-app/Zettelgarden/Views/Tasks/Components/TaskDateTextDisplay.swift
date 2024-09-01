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

    var displayText: String {
        if let task = taskViewModel.task {
            return formatDate(maybeDate: task.scheduled_date)
        }
        return "No Date"
    }
    var displayColor: Color {
        if let task = taskViewModel.task {
            if !task.is_complete && isPast(maybeDate: task.scheduled_date) {
                return .red
            }
            else if isToday(maybeDate: task.scheduled_date)
                || isTomorrow(maybeDate: task.scheduled_date)
            {
                return .green
            }
        }
        return .black

    }
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
            Text(displayText)
                .font(.caption)
                .foregroundColor(displayColor)
            if isRecurringTask(task: task) {
                Text("Recurring")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
    }
}
struct TaskDateTextDisplay_Preview: PreviewProvider {
    static var previews: some View {
        // Your mock TaskViewModel with a mock task
        let mockTaskViewModel = TaskViewModel()
        mockTaskViewModel.task = ZTask.sampleData[0]

        return TaskDateTextDisplay(taskViewModel: mockTaskViewModel)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }
}
