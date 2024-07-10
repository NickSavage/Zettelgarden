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
        if let tasks = taskListViewModel.openTasks {
            List {
                ForEach(tasks) { task in
                    TaskListItemView(task: task)
                }
            }
        }
    }
}
