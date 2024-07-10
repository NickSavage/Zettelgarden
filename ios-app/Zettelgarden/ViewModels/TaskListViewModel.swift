import Combine
import Foundation
import SwiftUI

class TaskListViewModel: ObservableObject {
    @Published var tasks: [ZTask]?
    @Published var openTasks: [ZTask]?
    @Published var todayTasks: [ZTask]?
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
                    self.openTasks = fetchedTasks.filter { !$0.is_complete }
                    self.todayTasks = fetchedTasks.filter { isToday(maybeDate: $0.scheduled_date) }
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
