import SwiftUI
import ZettelgardenShared

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
                    Image(systemName: task.is_complete ? "checkmark.circle" : "circle")
                    Spacer()
                    VStack(alignment: .leading) {
                        Text(task.title)
                        HStack {
                            TaskDateTextDisplay(taskViewModel: taskViewModel)

                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.001))  // Nearly transparent background
                    .contextMenu {
                        TaskListContextMenu(
                            showingEditTaskView: $showingEditTaskView,
                            taskViewModel: taskViewModel
                        )
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
                    viewModel: taskViewModel,
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
