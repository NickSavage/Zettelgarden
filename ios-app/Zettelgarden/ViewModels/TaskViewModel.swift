//
//  TaskViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Combine
import Foundation
import SwiftUI

class TaskViewModel: ObservableObject {
    @Published var task: ZTask?
    @Published var isLoading: Bool = true
    var taskListViewModel: TaskListViewModel?

    @AppStorage("jwt") private var token: String?

    func setTask(task: ZTask) {
        self.task = task
        isLoading = false
    }
    func setListViewModel(taskListViewModel: TaskListViewModel) {
        self.taskListViewModel = taskListViewModel
    }
    func completeTask() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        if var editedTask = task {
            editedTask.is_complete = true
            updateTask(token: token, task: editedTask) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let response):
                        if let viewModel = self.taskListViewModel {
                            viewModel.loadTasks()
                        }
                    case .failure(let error):
                        print(error)
                    }
                    self.isLoading = false
                }

            }
        }
    }

    func updateTask() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        if var editedTask = task {
            editedTask.is_complete = true
            updateTask(token: token, task: editedTask) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let response):
                        if let viewModel = self.taskListViewModel {
                            viewModel.loadTasks()
                        }
                    case .failure(let error):
                        print(error)
                    }
                    self.isLoading = false
                }

            }
        }

    }
}
