//
//  TaskListOptionsMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-11.
//

import SwiftUI
import ZettelgardenShared

struct TaskListOptionsMenu: View {
    @ObservedObject var taskListViewModel: TaskListViewModel

    var body: some View {
        Menu {
            Menu("Dates") {
                Button("Today", action: todayAction)
                Button("Tomorrow", action: tomorrowAction)
                Button("All", action: allAction)

            }
            Button(
                taskListViewModel.showCompleted ? "Hide Completed" : "Show Completed",
                action: toggleCompletedAction
            )
        } label: {
            Image(systemName: "gearshape")
                .padding()
        }
    }

    private func toggleCompletedAction() {
        taskListViewModel.showCompleted = !taskListViewModel.showCompleted
    }

    private func todayAction() {
        taskListViewModel.dateFilter = .today
    }
    private func tomorrowAction() {
        taskListViewModel.dateFilter = .tomorrow
    }

    private func allAction() {
        taskListViewModel.dateFilter = .all

    }
}

struct TaskListOptionsMenu_Preview: PreviewProvider {
    static var mockViewModel: TaskListViewModel = {
        let viewModel = TaskListViewModel()
        viewModel.loadTestTasks(tasks: ZTask.sampleData)
        return viewModel
    }()

    static var previews: some View {
        TaskListOptionsMenu(
            taskListViewModel: mockViewModel  // Use the static mockViewModel here
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Optional: improve appearance in the preview
    }
}
