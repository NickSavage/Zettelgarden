import SwiftUI
import ZettelgardenShared

struct TaskDateChangeView: View {

    @StateObject var taskViewModel: TaskViewModel

    var body: some View {
        VStack {
            Button(action: {
            }) {
                Text("No Date")
            }

            Button(action: {
            }) {
                Text("Today")
            }

            Button(action: {
            }) {
                Text("Tomorrow")
            }

            Button(action: {
            }) {
                Text("Next Week")
            }

            DatePicker(
                "Scheduled Date",
                selection: Binding(
                    get: { taskViewModel.task?.scheduled_date ?? Date() },
                    set: { newValue in taskViewModel.task?.scheduled_date = newValue }
                ),
                displayedComponents: [.date]
            ).datePickerStyle(GraphicalDatePickerStyle())
                .labelsHidden()
        }

    }
}

struct TaskDateChangeView_Preview: PreviewProvider {

    static var mockViewModel: TaskViewModel = getTestTaskViewModel()
    static var previews: some View {
        TaskDateChangeView(taskViewModel: mockViewModel)
    }
}
