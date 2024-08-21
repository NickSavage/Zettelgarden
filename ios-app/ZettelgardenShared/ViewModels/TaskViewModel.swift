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
    func isComplete() -> Bool {
        if var actualTask = self.task {
            return actualTask.is_complete
        }
        return false
    }
    func completeTask() {
        if var editedTask = task {
            editedTask.is_complete = true
            self.task = editedTask
            handleUpdateTask()
        }
    }
    func uncompleteTask() {
        if var editedTask = task {
            editedTask.is_complete = false
            self.task = editedTask
            handleUpdateTask()
        }
    }

    func deferTomorrow() {
        if var editedTask = task {
            let calendar = Calendar.current
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date())!
            editedTask.scheduled_date = tomorrow
            self.task = editedTask
            handleUpdateTask()
        }

    }

    func clearScheduledDate() {
        if var editedTask = task {
            editedTask.scheduled_date = nil
            self.task = editedTask
            handleUpdateTask()
        }

    }

    func handleUpdateTask() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        if var editedTask = task {
            updateTask(token: token, task: editedTask) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(_):
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
