//
//  EditTaskView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import SwiftUI

struct EditTaskView: View {
    @Binding var task: ZTask
    @AppStorage("jwt") private var token: String?

    var onSave: () -> Void

    var body: some View {
        VStack {
            Form {
                Section(header: Text("Add Task")) {
                    TextField("Title", text: $task.title)
                    DatePicker(
                        "Scheduled Date",
                        selection: Binding<Date>(
                            get: { task.scheduled_date ?? Date() },  // Provide a default Date() or handle nil case
                            set: { newValue in task.scheduled_date = newValue }
                        ),
                        displayedComponents: [.date]
                    )
                }

            }
            Button(action: {
                guard let token = token else {
                    print("Token is missing")
                    return
                }
                updateTask(token: token, task: task) { result in
                    switch result {
                    case .success(_):
                        print("success!")
                        onSave()
                    case .failure(let error):
                        print("Failed to save new card: \(error)")
                    }
                }
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
