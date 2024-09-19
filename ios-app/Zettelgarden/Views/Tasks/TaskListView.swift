import SwiftUI
import ZettelgardenShared

struct TaskListView: View {
    @EnvironmentObject var taskListViewModel: TaskListViewModel
    @State private var showingAddTaskView = false
    @State private var showingFilter = false

    var body: some View {
        ZStack {
            VStack {
                if showingFilter {
                    TextField(
                        "Filter",
                        text: Binding(
                            get: { taskListViewModel.filterText },
                            set: { taskListViewModel.filterText = $0 }
                        )
                    )
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                    .padding(.top, 10)

                }

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
            TaskListOptionsMenu(taskListViewModel: taskListViewModel, showingFilter: $showingFilter)
        }
        .onAppear {
            taskListViewModel.loadTasks()
        }
    }
}

struct TaskListView_Preview: PreviewProvider {
    static var mockViewModel: TaskListViewModel = getTestTaskListViewModel()

    static var previews: some View {
        TaskListView()
            .previewLayout(.sizeThatFits)
            .padding()
    }
}
