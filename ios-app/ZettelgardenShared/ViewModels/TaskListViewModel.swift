//
//  TaskListViewModel.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Combine
import SwiftUI

public class TaskListViewModel: ObservableObject {
    @Published var tasks: [ZTask]?
    @Published var isLoading: Bool = true
    @Published public var dateFilter: TaskDisplayOptions = .today
    @Published var filterText: String = ""
    @Published public var showCompleted: Bool = false

    private var timer: Timer?

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    public init() {
        loadTasks()
    }

    public var filteredTasks: [ZTask] {
        let tasks = self.tasks ?? []
        let filtered: [ZTask]
        if self.dateFilter == .today && !self.showCompleted {
            filtered = tasks.filter {
                !$0.is_complete && isTodayOrPast(maybeDate: $0.scheduled_date)
            }
        }
        else if self.dateFilter == .today && self.showCompleted {
            filtered = tasks.filter {
                !$0.is_complete && isTodayOrPast(maybeDate: $0.scheduled_date)
                    || $0.is_complete && isToday(maybeDate: $0.scheduled_date)
            }
        }
        else if self.dateFilter == .tomorrow {
            filtered = tasks.filter { !$0.is_complete && isTomorrow(maybeDate: $0.scheduled_date) }
        }
        else {
            filtered = self.showCompleted ? tasks : tasks.filter { !$0.is_complete }
        }
        if filterText == "" {
            return filtered
        }
        else {
            return filtered.filter { $0.title.lowercased().contains(filterText.lowercased()) }
        }
    }

    public func countTodayTasks() -> Int {
        let tasks = self.tasks ?? []
        let filtered = tasks.filter {
            !$0.is_complete && isTodayOrPast(maybeDate: $0.scheduled_date)
        }
        return filtered.count
    }
    public func loadTasks() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)
        fetchTasks(session: session) { result in
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
    }

    public func loadTestTasks(tasks: [ZTask]) {
        self.tasks = tasks
    }

    public func createNewTask(newTask: ZTask) {
        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)
        createTask(session: session, task: newTask) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(_):
                    self.loadTasks()
                case .failure(let error):
                    print(error)
                    print("Unable to create task: \(error.localizedDescription)")
                }
            }
        }
    }
    public func onScenePhaseChanged(to newPhase: ScenePhase) {
        if newPhase == .active {
            self.loadTasks()
            startTimer()
        }
        else {
            stopTimer()
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { _ in
            self.loadTasks()
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

}