//
//  EditTaskView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import SwiftUI

struct EditTaskView: View {
    @ObservedObject var taskViewModel: TaskViewModel
    @State private var title: String = ""
    @State private var scheduledDate: Date = Date()

    var body: some View {
        VStack {
            if let task = taskViewModel.task {
                Form {
                    Section(header: Text("Add Task")) {
                        TextField("Title", text: $title)
                        DatePicker(
                            "Scheduled Date",
                            selection: $scheduledDate,
                            displayedComponents: [.date]
                        )
                    }

                }
                Button(action: {
                    taskViewModel.saveTask()
                }) {
                    Text("Save")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()

            }
        }
    }

}
