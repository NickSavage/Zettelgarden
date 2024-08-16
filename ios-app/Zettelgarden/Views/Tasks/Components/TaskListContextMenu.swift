//
//  TaskListContextMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-15.
//

import SwiftUI

struct TaskListContextMenu: View {
    @Binding var showingEditTaskView: Bool
    @ObservedObject var taskViewModel: TaskViewModel
    var body: some View {
        Group {

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
        }
    }
}
