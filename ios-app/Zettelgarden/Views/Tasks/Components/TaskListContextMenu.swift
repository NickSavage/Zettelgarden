//
//  TaskListContextMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-15.
//

import SwiftUI
import ZettelgardenShared

struct TaskListContextMenu: View {
    @Binding var showingEditTaskView: Bool
    @Binding var showingDateChangeView: Bool
    @ObservedObject var taskViewModel: TaskViewModel
    var body: some View {
        Group {
            if taskViewModel.isComplete() {
                Button(action: {
                    taskViewModel.uncompleteTask()
                }) {
                    Text("Mark Task As Incomplete")
                }

            }
            else {
                Button(action: {
                    taskViewModel.completeTask()
                }) {
                    Text("Mark Task As Complete")
                }

            }
            Button(action: {
                showingDateChangeView.toggle()
            }) {
                Text("Change Date")
            }

            Button(action: {
                let impactMed = UIImpactFeedbackGenerator(style: .medium)
                impactMed.impactOccurred()
                showingEditTaskView.toggle()
            }) {
                Text("Edit Task")
                Image(systemName: "pencil")
            }
            Divider()
            if let task = taskViewModel.task {
                if task.card_pk > 0 {
                    Button(action: {
                        taskViewModel.unlinkCard()

                    }) {
                        Text("Unlink Card")
                    }

                }
                else {

                    Button(action: {

                    }) {
                        Text("Link Card")
                    }
                }

            }
            else {

            }
            Divider()
            Button(action: {
                taskViewModel.handleDeleteTask()
            }) {
                Text("Delete")
            }
        }
    }
}
struct TaskListContextMenu_Preview: PreviewProvider {
    @State static var showingEditTaskView = false
    @State static var showingDateChangeView = false
    static var previews: some View {
        // Your mock TaskViewModel with a mock task
        let mockTaskViewModel = TaskViewModel()
        mockTaskViewModel.task = ZTask.sampleData[0]

        return TaskListContextMenu(
            showingEditTaskView: $showingEditTaskView,
            showingDateChangeView: $showingDateChangeView,
            taskViewModel: mockTaskViewModel
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Add some padding for better appearance in the preview
    }
}
