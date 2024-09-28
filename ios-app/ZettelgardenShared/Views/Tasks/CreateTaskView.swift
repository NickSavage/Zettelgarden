import SwiftUI

public struct CreateTaskView: View {

    @Binding var newTask: ZTask
    @EnvironmentObject var taskListViewModel: TaskListViewModel

    @State private var title: String = ""
    @State private var scheduledDate: Date = Date()
    @State private var message: String = ""

    var onSave: (_ task: ZTask) -> Void

    public init(
        newTask: Binding<ZTask>,
        onSave: @escaping (_ task: ZTask) -> Void
    ) {
        self._newTask = newTask
        self.onSave = onSave
    }

    private func saveTask() {
        newTask.scheduled_date = scheduledDate
        taskListViewModel.createNewTask(newTask: newTask)
        title = ""
        scheduledDate = Date()
        self.message = "Task created"
        onSave(newTask)
        newTask = ZTask.emptyTask
    }

    public var body: some View {
        VStack {
            Text(message)
            Form {
                Section(header: Text("Add Task")) {
                    TextField("Title", text: $newTask.title)
                    DatePicker(
                        "Scheduled Date",
                        selection: $scheduledDate,
                        displayedComponents: [.date]
                    )
                }

            }
            Button(action: {
                saveTask()
            }) {
                Text("Save")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.white)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding()
        }

    }

}
