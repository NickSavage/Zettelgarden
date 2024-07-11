import SwiftUI

struct TaskListItemView: View {
    @AppStorage("jwt") private var token: String?
    @ObservedObject var taskListViewModel: TaskListViewModel
    @StateObject private var taskViewModel = TaskViewModel()

    @State private var showingEditTaskView = false
    let inputTask: ZTask

    var body: some View {
        VStack {
            if let task = taskViewModel.task {
                HStack {
                    Button(action: {
                        taskViewModel.completeTask()
                    }) {
                        Text(task.is_complete ? "[x]" : "[ ]")
                    }
                    VStack(alignment: .leading) {
                        Button(action: {
                            showingEditTaskView.toggle()

                        }) {
                            Text(task.title)
                        }
                        HStack {
                            if let date = task.scheduled_date {
                                if isToday(maybeDate: date) {
                                    Text("Today")
                                        .font(.caption)
                                        .foregroundColor(.green)
                                }
                                else {
                                    Text(date, style: .date).font(.caption)
                                }
                            }
                            else {
                                Text("No Date").font(.caption)
                            }

                        }
                    }
                    Spacer()
                    Text("asd")
                }
            }
        }
        .onAppear {
            taskViewModel.setTask(task: inputTask)
            taskViewModel.setListViewModel(taskListViewModel: taskListViewModel)
        }
        .onChange(of: inputTask) { newTask in
            taskViewModel.setTask(task: newTask)
        }
        .sheet(isPresented: $showingEditTaskView) {
            EditTaskView(taskViewModel: taskViewModel)
        }
    }

}

struct TaskListItem_Previews: PreviewProvider {
    static var previews: some View {
        TaskListItemWrapper()
    }

    struct TaskListItemWrapper: View {
        var task = ZTask.sampleData[0]
        var listViewModel = TaskListViewModel()

        var body: some View {
            TaskListItemView(taskListViewModel: listViewModel, inputTask: task).previewLayout(
                .fixed(width: 400, height: 80)
            )
        }

    }
}
