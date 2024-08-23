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
                let impactMed = UIImpactFeedbackGenerator(style: .medium)
                impactMed.impactOccurred()
                showingEditTaskView.toggle()
            }) {
                Text("Edit Task")
                Image(systemName: "pencil")
            }
            Button(action: {
                taskViewModel.deferTomorrow()
            }) {
                Text("Defer To Tomorrow")

            }
            Button(action: {

                taskViewModel.clearScheduledDate()
            }) {
                Text("Set No Date")
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
