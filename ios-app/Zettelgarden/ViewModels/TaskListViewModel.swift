import Combine
import Foundation
import SwiftUI

class TaskListViewModel: ObservableObject {
    @Published var tasks: [ZTask]?
    @Published var isLoading: Bool = true
    @Published var dateFilter: TaskDisplayOptions = .today
    @Published var filterText: String = ""

    @AppStorage("jwt") private var token: String?

    var filteredTasks: [ZTask] {
        let tasks = self.tasks ?? []
        let filtered: [ZTask]
        if self.dateFilter == .today {
            filtered = tasks.filter {!$0.is_complete && isTodayOrPast(maybeDate: $0.scheduled_date)}
        }
        else if self.dateFilter == .tomorrow {
            filtered = tasks.filter { !$0.is_complete && isTomorrow(maybeDate: $0.scheduled_date) }
        }
        else if self.dateFilter == .all {
            filtered = tasks.filter { !$0.is_complete }
        }
        else if self.dateFilter == .closedToday {
            filtered = tasks.filter { $0.is_complete && isToday(maybeDate: $0.completed_at) }
        }
        else if self.dateFilter == .closedAll {
            filtered = tasks.filter { $0.is_complete }
        }
        else {
            filtered =  tasks
        }
        if filterText == "" {
          return filtered
        }
        else {
          return filtered.filter { $0.title.lowercased().contains(filterText.lowercased())}
        }
    }
    func loadTasks() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        print("start")
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
}
