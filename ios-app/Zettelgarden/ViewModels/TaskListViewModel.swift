import Combine
import Foundation
import SwiftUI

class TaskListViewModel: ObservableObject {
    @Published var tasks: [ZTask]?
    @Published var isLoading: Bool = true
    @Published var dateFilter: TaskDisplayOptions = .today
    @Published var filterText: String = ""
    @Published var showCompleted: Bool = false

    private var timer: Timer?

    @AppStorage("jwt") private var token: String?
    init() {
        loadTasks()
    }
    var filteredTasks: [ZTask] {
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
    }

    func createNewTask(newTask: ZTask) {
        guard let token = token else {
            print("Token is missing")
            return
        }
        createTask(token: token, task: newTask) { result in
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
    func onScenePhaseChanged(to newPhase: ScenePhase) {
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
