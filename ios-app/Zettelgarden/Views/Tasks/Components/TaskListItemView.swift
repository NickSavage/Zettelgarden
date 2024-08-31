import SwiftUI
import ZettelgardenShared

struct TaskListItemView: View {
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var jwt: String?
    @ObservedObject var taskListViewModel: TaskListViewModel
    @StateObject private var taskViewModel = TaskViewModel()

    @State private var showingEditTaskView = false
    @State private var showingDetailView = false
    @State private var showingDateChangeView = false
    @State private var showingAddTagView = false
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
                            ForEach(taskViewModel.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.caption)
                                    .foregroundColor(.purple)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.001))  // Nearly transparent background
                    .contextMenu {
                        TaskListContextMenu(
                            showingEditTaskView: $showingEditTaskView,
                            showingDateChangeView: $showingDateChangeView,
                            showingAddTagView: $showingAddTagView,
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
                .onTapGesture {
                    if let _ = taskViewModel.task {
                        showingDetailView = true
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
        .sheet(isPresented: $showingDetailView) {
            DisplayTaskView(
                taskViewModel: taskViewModel,
                isPresented: $showingDetailView
            )
        }
        .sheet(isPresented: $showingEditTaskView) {
            if var _ = taskViewModel.task {
                EditTaskView(
                    viewModel: taskViewModel,
                    onSave: handleSaveTask
                )
            }
        }
        .sheet(isPresented: $showingDateChangeView) {
            TaskDateChangeView(taskViewModel: taskViewModel, isPresented: $showingDateChangeView)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showingAddTagView) {
            TaskAddTagView(
                taskViewModel: taskViewModel,
                taskListViewModel: taskListViewModel,
                isPresented: $showingAddTagView
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }
}

struct TaskListItemView_Preview: PreviewProvider {
    static var previews: some View {
        TaskListItemView(
            taskListViewModel: TaskListViewModel(),
            inputTask: ZTask.sampleData[0]
        )
    }
}
