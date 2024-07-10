//
//  TaskListView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-09.
//

import SwiftUI

struct TaskListView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel

    var body: some View {
        if let tasks = taskListViewModel.tasks {
            List {
                ForEach(tasks.filter { !$0.is_complete && isToday(maybeDate: $0.scheduled_date) }) {
                    task in
                    TaskListItemView(taskListViewModel: taskListViewModel, inputTask: task)
                }
            }
            .refreshable {
                taskListViewModel.loadTasks()
            }
        }
    }
}
