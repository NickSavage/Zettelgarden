import SwiftUI

struct TaskListView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var showingAddTaskView = false

    var body: some View {
        ZStack {
            VStack {
                if !taskListViewModel.filteredTasks.isEmpty {
                    List {
                        Section(header: Text("Tasks").font(.headline)) {
                            ForEach(taskListViewModel.filteredTasks) { task in
                                TaskListItemView(
                                    taskListViewModel: taskListViewModel,
                                    inputTask: task
                                )
                            }

                        }
                    }
                    .refreshable {
                        taskListViewModel.loadTasks()
                    }
                }
                else {
                    Text("No tasks available.")
                    Spacer()
                }

            }
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    FloatingButton(
                        action: {
                            showingAddTaskView.toggle()
                        },
                        imageText: "plus"
                    )

                }
            }
        }
        .sheet(isPresented: $showingAddTaskView) {
            AddTaskView(taskListViewModel: taskListViewModel)
        }
        .toolbar {
            TaskListOptionsMenu(taskListViewModel: taskListViewModel)
        }
        .onAppear {
            taskListViewModel.loadTasks()
        }
    }
}

enum TaskDisplayOptions: Int, CaseIterable, Identifiable {
    case today = 1
    case tomorrow = 2
    case closedToday = 3
    case all = 4
    case closedAll = 5

    var id: Int { self.rawValue }
    var title: String {
        switch self {
        case .today:
            return "Today"
        case .tomorrow:
            return "Tomorrow"
        case .closedToday:
            return "Closed Today"
        case .all:
            return "All"
        case .closedAll:
            return "Closed All"
        }
    }
}
