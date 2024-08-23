//
//  TaskViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Combine
import Foundation
import SwiftUI

public class TaskViewModel: ObservableObject {
    @Published public var task: ZTask?
    @Published public var isLoading: Bool = true
    var taskListViewModel: TaskListViewModel?

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    public init() {}
    public func setTask(task: ZTask) {
        self.task = task
        isLoading = false
    }
    public func setListViewModel(taskListViewModel: TaskListViewModel) {
        self.taskListViewModel = taskListViewModel
    }
    public func isComplete() -> Bool {
        if var actualTask = self.task {
            return actualTask.is_complete
        }
        return false
    }
    public func completeTask() {
        if var editedTask = task {
            editedTask.is_complete = true
            self.task = editedTask
            handleUpdateTask()
        }
    }
    public func uncompleteTask() {
        if var editedTask = task {
            editedTask.is_complete = false
            self.task = editedTask
            handleUpdateTask()
        }
    }
    public func unlinkCard() {
        if var editedTask = task {
            editedTask.card_pk = 0
            self.task = editedTask
            handleUpdateTask()
        }
    }
    public func handleDeleteTask() {

        guard let token = token else {
            print("Token is missing")
            return
        }
        if var editedTask = task {
            deleteTask(token: token, task: editedTask) { result in
                DispatchQueue.main.async {
                    if let viewModel = self.taskListViewModel {
                        viewModel.loadTasks()
                    }
                    self.isLoading = false
                }

            }
        }
    }

    public func deferTomorrow() {
        if var editedTask = task {
            let calendar = Calendar.current
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date())!
            editedTask.scheduled_date = tomorrow
            self.task = editedTask
            handleUpdateTask()
        }

    }

    public func clearScheduledDate() {
        if var editedTask = task {
            editedTask.scheduled_date = nil
            self.task = editedTask
            handleUpdateTask()
        }

    }

    public func handleUpdateTask() {
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
