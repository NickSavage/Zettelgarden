import Combine
import Foundation
import SwiftUI

class TaskListViewModel: ObservableObject {
    @Published var tasks: [ZTask]?
    @Published var openTasks: [ZTask]?
    @Published var todayOpenTasks: [ZTask]?
    @Published var isLoading: Bool = true
    @Published var dateFilter: TaskDisplayOptions = .today

    @AppStorage("jwt") private var token: String?

    var filteredTasks: [ZTask] {
        let tasks = self.tasks ?? []
        if self.dateFilter == .today {
            return tasks.filter { !$0.is_complete && isToday(maybeDate: $0.scheduled_date) }
        } else if self.dateFilter == .all {
            return tasks.filter { !$0.is_complete }
        }
        else {
            return tasks
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
                    for task in fetchedTasks {
                        print("Task: \(task)")
                        print("Is Today: \(isToday(maybeDate: task.scheduled_date))")
                    }

                case .failure(let error):
                    print(error)
                    print("Unable to load tasks: \(error.localizedDescription)")
                }
                self.isLoading = false
                print("done")
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
