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
    @State private var newTask: ZTask = ZTask.emptyTask

    @EnvironmentObject var taskListViewModel: TaskListViewModel
    func handleAttachments() {

        for provider in data! {
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                if let url = url as? URL {
                    newTask.title = url.absoluteString
                    return
                }

            }
            // Check for Plain Text type
            provider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) {
                (text, error) in
                if let text = text as? String {
                    DispatchQueue.main.async {
                        newTask.title = text
                    }
                }
            }
        }
    }

    var body: some View {
        VStack {
            let onSave: (_ task: ZTask) -> Void = { task in
                extensionContext!.completeRequest(returningItems: nil, completionHandler: nil)
            }
            CreateTaskView(newTask: $newTask, onSave: onSave)
                .environmentObject(taskListViewModel)
        }
        .onAppear {
            handleAttachments()
        }
    }
}
