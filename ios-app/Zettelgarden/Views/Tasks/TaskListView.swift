import SwiftUI

struct TaskListView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var showingAddTaskView = false

    var body: some View {
        VStack {
            if !taskListViewModel.filteredTasks.isEmpty {
                List {
                    ForEach(taskListViewModel.filteredTasks) { task in
                        TaskListItemView(taskListViewModel: taskListViewModel, inputTask: task)
                    }
                }
                .refreshable {
                    taskListViewModel.loadTasks()
                }
            }
            else {
                Text("No tasks available.")
            }
        }
        .sheet(isPresented: $showingAddTaskView) {
            AddTaskView(taskListViewModel: taskListViewModel)
        }
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarLeading) {
                Button(action: {
                    showingAddTaskView.toggle()
                }) {
                    Text("Add Task")
                }
                Picker("Filter", selection: $taskListViewModel.dateFilter) {
                    ForEach(TaskDisplayOptions.allCases) { option in
                        Text(option.title).tag(option)
                    }
                }
            }
        }
    }
}

enum TaskDisplayOptions: Int, CaseIterable, Identifiable {
    case today = 1
    case all = 2
    case closedToday = 3

    var id: Int { self.rawValue }
    var title: String {
        switch self {
        case .today:
            return "Today"
        case .all:
            return "All"
        case .closedToday:
            return "Closed Today"
        }
    }
}
