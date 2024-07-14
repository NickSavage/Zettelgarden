import SwiftUI

struct TaskListItemView: View {
    @AppStorage("jwt") private var token: String?
    @ObservedObject var taskListViewModel: TaskListViewModel
    @StateObject private var taskViewModel = TaskViewModel()

    @State private var showingEditTaskView = false
    let inputTask: ZTask

    func handleSaveTask() {
        showingEditTaskView.toggle()
    }

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
                        Text(task.title)
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
                            if isRecurringTask(task: task) {
                                Text("Recurring")
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            }

                        }
                    }
                    Spacer()
                    if let card = task.card {
                        if card.id == 0 {
                            Text("")
                        }
                        else {
                            Text("[\(card.card_id)]")
                                .bold()
                                .foregroundColor(.blue)

                        }

                    }
                }
                .onLongPressGesture(minimumDuration: 0.5) {
                    let impactMed = UIImpactFeedbackGenerator(style: .medium)
                    impactMed.impactOccurred()
                    showingEditTaskView.toggle()
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
            if var task = taskViewModel.task {
                EditTaskView(
                    task: Binding(
                        get: { task },
                        set: { newValue in task = newValue }
                    ),
                    onSave: handleSaveTask
                )
            }
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
