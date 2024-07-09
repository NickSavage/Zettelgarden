//
//  TaskViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-08.
//

import Combine
import Foundation
import SwiftUI

class TaskViewModel: ObservableObject {
    @Published var tasks: [Task]?
    @Published var isLoading: Bool = true

    @AppStorage("jwt") private var token: String?

    func loadTasks() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        fetchTasks(token: token) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedTasks):
                    self.tasks = fetchedTasks
                case .failure(let error):
                    print(error)
                    print("Unable to load tasks: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
        print("loading tasks")

    }
}
