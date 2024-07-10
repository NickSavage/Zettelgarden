import SwiftUI

struct TaskListItemView: View {
    @AppStorage("jwt") private var token: String?
    @ObservedObject var taskListViewModel: TaskListViewModel
    @StateObject private var taskViewModel = TaskViewModel()

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
                    VStack {
                        Text(task.title)
                        // if let date = task.scheduled_date {
                        //     Text(formatDate(date: date))
                        // }
                        // else {
                        //     Text("No Date")  // Or any default text
                        // }
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
    }

    private func formatDate(date: String) -> String {
        // Add your date formatting logic here
        return date
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
