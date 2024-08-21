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
    //   @StateObject var taskListViewModel = TaskListViewModel()

    func handleAttachments() {

        for provider in data! {
            print(provider)
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                print(url)
                if let url = url as? URL {
                    print(url)
                    sharedURL = url
                    //                  saveTask(title: url.absoluteString)
                }

            }
        }
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
