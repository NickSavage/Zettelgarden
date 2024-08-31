import SwiftUI
import ZettelgardenShared

struct TaskDateChangeView: View {

    @StateObject var taskViewModel: TaskViewModel
    @Binding var isPresented: Bool

    var body: some View {
        VStack {
            Button(action: {
                taskViewModel.deferDate(to: .noDate)
                isPresented = false
            }) {
                Text("No Date")
            }
            .padding()

            Button(action: {
                taskViewModel.deferDate(to: .today)
                isPresented = false
            }) {
                Text("Today")
            }
            .padding()

            Button(action: {
                taskViewModel.deferDate(to: .tomorrow)
                isPresented = false
            }) {
                Text("Tomorrow")
            }
            .padding()

            Button(action: {
                taskViewModel.deferDate(to: .nextWeek)
                isPresented = false
            }) {
                Text("Next Week")
            }
            .padding()

            DatePicker(
                "Scheduled Date",
                selection: Binding(
                    get: { taskViewModel.task?.scheduled_date ?? Date() },
                    set: { newValue in
                        taskViewModel.setScheduledDate(to: newValue)
                        isPresented = false
                    }
                ),
                displayedComponents: [.date]
            ).datePickerStyle(CompactDatePickerStyle())
                .labelsHidden()
        }

    }
}

struct TaskDateChangeView_Preview: PreviewProvider {

    @State static var isPresented = true
    static var mockViewModel: TaskViewModel = getTestTaskViewModel()

    static var previews: some View {
        TaskDateChangeView(taskViewModel: mockViewModel, isPresented: $isPresented)
    }
}
