import SwiftUI

struct AddTaskView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var title: String = ""
    @State private var scheduledDate: Date = Date()

    var body: some View {
        VStack {
            Form {
                Section(header: Text("Add Task")) {
                    TextField("Title", text: $title)
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

    private func saveTask() {
        print(scheduledDate)
        let newTask = ZTask(
            id: -1,
            card_pk: -1,
            user_id: -1,
            scheduled_date: scheduledDate,
            created_at: Date(),
            updated_at: Date(),
            completed_at: nil,
            title: title,
            is_complete: false,
            is_deleted: false
        )
        taskListViewModel.createNewTask(newTask: newTask)
        taskListViewModel.loadTasks()  // Assuming this refreshes the tasks list
        title = ""
        scheduledDate = Date()
    }
}
