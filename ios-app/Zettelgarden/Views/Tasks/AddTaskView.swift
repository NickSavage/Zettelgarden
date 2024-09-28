import SwiftUI
import ZettelgardenShared

struct AddTaskView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var newTask: ZTask = ZTask.emptyTask

    var body: some View {
        VStack {
            CreateTaskView(newTask: $newTask, onSave: saveTask)
        }
    }

    private func saveTask(_ newTask: ZTask) {
        taskListViewModel.loadTasks()  // Assuming this refreshes the tasks list
    }
}

struct AddTaskView_Preview: PreviewProvider {
    static var mockViewModel: TaskListViewModel = getTestTaskListViewModel()

    static var previews: some View {
        AddTaskView(
            taskListViewModel: mockViewModel  // Use the static mockViewModel here
        )
        .previewLayout(.sizeThatFits)
        .environmentObject(mockViewModel)
        .padding()  // Optional: improve appearance in the preview
    }
}
