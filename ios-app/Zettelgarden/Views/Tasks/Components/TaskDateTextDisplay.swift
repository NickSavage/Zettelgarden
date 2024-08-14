//
//  TaskDateTextDisplay.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-14.
//

import SwiftUI

struct TaskDateTextDisplay: View {
    @ObservedObject var taskViewModel: TaskViewModel
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
