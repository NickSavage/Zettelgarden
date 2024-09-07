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
    @Binding var showingFilter: Bool

    var body: some View {
        Menu {
            Menu("Dates") {
                Button("Today", action: todayAction)
                Button("Tomorrow", action: tomorrowAction)
                Button("All", action: allAction)

            }
            Menu("Filter By Tag") {
                ForEach(taskListViewModel.existingTags, id: \.self) { tag in

                    Button(action: {
                        taskListViewModel.filterText = tag

                    }) {
                        Text(tag)
                    }
                }
            }
            if taskListViewModel.filterText != "" {
                Button(
                    "Remove Filter",
                    action: { taskListViewModel.filterText = "" }
                )

            }
            Divider()

            Button(
                taskListViewModel.showCompleted ? "Hide Completed" : "Show Completed",
                action: toggleCompletedAction
            )
            Button(
                showingFilter ? "Hide Filter" : "Show Filter",
                action: toggleShowFilter
            )
        } label: {
            Image(systemName: "gearshape")
                .padding()
        }
    }

    private func toggleCompletedAction() {
        taskListViewModel.showCompleted = !taskListViewModel.showCompleted
    }

    private func toggleShowFilter() {
        showingFilter = !showingFilter
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
    static var mockViewModel: TaskListViewModel = getTestTaskListViewModel()
    @State static var showingFilter = false

    static var previews: some View {
        TaskListOptionsMenu(
            taskListViewModel: mockViewModel,
            showingFilter: $showingFilter
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Optional: improve appearance in the preview
    }
}
