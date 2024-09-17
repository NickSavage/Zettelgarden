//
//  ShareAddTaskView.swift
//  ZettelgardenShare
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation
import SwiftUI
import ZettelgardenShared

struct ShareAddTaskView: View {
    var extensionContext: NSExtensionContext?
    @State var data: [NSItemProvider]?
    @StateObject var taskListViewModel = TaskListViewModel()

    @State private var title: String = ""
    @State private var scheduledDate: Date = Date()
    @State private var message: String = ""

    func handleAttachments() {

        for provider in data! {
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                if let url = url as? URL {
                    title = url.absoluteString
                }

            }
            // Check for Plain Text type
            provider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) {
                (text, error) in
                if let text = text as? String {
                    DispatchQueue.main.async {
                        title = text
                    }
                }
            }
        }
    }

    private func saveTask() {
        let newTask = ZTask(
            id: -1,
            card_pk: -1,
            user_id: -1,
            scheduled_date: scheduledDate,
            created_at: Date(),
            updated_at: Date(),
            completed_at: nil,
            title: title,
            is_complete: false,
            is_deleted: false,
            card: nil
        )
        taskListViewModel.createNewTask(newTask: newTask)
        extensionContext!.completeRequest(returningItems: nil, completionHandler: nil)
    }

    var body: some View {
        VStack {
            Text(message)
            Form {
                Section(header: Text("Add Task")) {
                    TextField("Title", text: $title)
                    DatePicker(
                        "Scheduled Date",
                        selection: $scheduledDate,
                        displayedComponents: [.date]
                    )
                }
                Button(action: {
                    saveTask()
                }) {
                    Text("Save")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
            }
        }
        .onAppear {
            handleAttachments()
        }
    }
}
