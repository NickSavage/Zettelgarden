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

    @State var data: [NSItemProvider]?
    @State var sharedURL: URL?
    @StateObject var taskListViewModel = TaskListViewModel()

    func handleAttachments() {

        for provider in data! {
            print(provider)
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                print(url)
                if let url = url as? URL {
                    print(url)
                    sharedURL = url
                    saveTask(title: url.absoluteString)
                }

            }
        }
    }

    private func saveTask(title: String) {
        let newTask = ZTask(
            id: -1,
            card_pk: -1,
            user_id: -1,
            scheduled_date: Date(),
            created_at: Date(),
            updated_at: Date(),
            completed_at: nil,
            title: title,
            is_complete: false,
            is_deleted: false,
            card: nil
        )
        taskListViewModel.createNewTask(newTask: newTask)
    }

    var body: some View {
        VStack {
            Spacer()
            Text("Hello, from share extension").font(.largeTitle)
            if let url = sharedURL {
                Text(url.absoluteString)

            }
            Spacer()
        }
        .onAppear {
            handleAttachments()
        }
    }
}
