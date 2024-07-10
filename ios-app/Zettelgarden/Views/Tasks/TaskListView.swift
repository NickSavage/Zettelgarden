//
//  TaskListView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-09.
//

import SwiftUI

struct TaskListView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var showingAddTaskView = false

    var body: some View {
        VStack {
            if let tasks = taskListViewModel.tasks {
                List {
                    ForEach(
                        tasks.filter { !$0.is_complete && isToday(maybeDate: $0.scheduled_date) }
                    ) {
                        task in
                        TaskListItemView(taskListViewModel: taskListViewModel, inputTask: task)
                    }
                }
                .refreshable {
                    taskListViewModel.loadTasks()
                }
            }
        }
        .sheet(isPresented: $showingAddTaskView) {
            AddTaskView(taskListViewModel: taskListViewModel)
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: {
                    showingAddTaskView.toggle()
                }) {
                    Text("Add Task")
                }
            }
        }

    }
}
