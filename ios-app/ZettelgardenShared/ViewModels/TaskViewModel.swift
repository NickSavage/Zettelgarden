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

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    public var tags: [String] {
        guard let title = task?.title else { return [] }
        let pattern = "(?<=\\s|^)#\\w+"  // Match #tags surrounded by spaces or start of string
        let regex = try? NSRegularExpression(pattern: pattern)
        let results = regex?.matches(in: title, range: NSRange(title.startIndex..., in: title))

        return results?.compactMap {
            Range($0.range, in: title).map { String(title[$0]) }
        } ?? []
    }
    public var titleWithoutTags: String {
        guard let title = task?.title else { return "" }
        let pattern = "#\\w+"  // Match #tags
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(title.startIndex..., in: title)

        let cleanedTitle =
            regex?.stringByReplacingMatches(in: title, options: [], range: range, withTemplate: "")
            ?? title
        return cleanedTitle.trimmingCharacters(in: .whitespacesAndNewlines)
    }
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
    public func addTag(tag: String) {
        if var editedTask = task {
            editedTask.title = editedTask.title + " " + tag
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
            let session = openSession(token: token, environment: environment)
            deleteTask(session: session, task: editedTask) { result in
                DispatchQueue.main.async {
                    if let viewModel = self.taskListViewModel {
                        viewModel.loadTasks()
                    }
                    self.isLoading = false
                }

            }
        }
    }

    public func deferDate(to: TaskDeferDate) {
        if var editedTask = task {
            let calendar = Calendar.current

            switch to {
            case .today:
                editedTask.scheduled_date = Date()

            case .noDate:
                editedTask.scheduled_date = nil

            case .tomorrow:
                if let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date()) {
                    editedTask.scheduled_date = tomorrow
                }

            case .nextWeek:
                if let nextWeek = calendar.date(byAdding: .day, value: 7, to: Date()) {
                    editedTask.scheduled_date = nextWeek
                }
            }

            self.task = editedTask
            handleUpdateTask()
        }
    }

    public func setScheduledDate(to: Date) {
        if var editedTask = task {
            editedTask.scheduled_date = to
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
            let session = openSession(token: token, environment: environment)
            updateTask(session: session, task: editedTask) { result in
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
