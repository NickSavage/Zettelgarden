import SwiftUI
import ZettelgardenShared

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

struct TaskListView_Preview: PreviewProvider {
    static var mockViewModel: TaskListViewModel = getTestTaskListViewModel()

    static var previews: some View {
        TaskListView(
            taskListViewModel: mockViewModel  // Use the static mockViewModel here
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Optional: improve appearance in the preview
    }
}
