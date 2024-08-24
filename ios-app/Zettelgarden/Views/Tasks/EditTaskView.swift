import SwiftUI
import ZettelgardenShared

struct EditTaskView: View {
    @ObservedObject var viewModel: TaskViewModel
    var onSave: () -> Void

    var body: some View {
        VStack {
            Form {
                Section(header: Text("Edit Task")) {
                    TextField(
                        "Title",
                        text: Binding(
                            get: { viewModel.task?.title ?? "" },
                            set: { viewModel.task?.title = $0 }
                        )
                    )
                    DatePicker(
                        "Scheduled Date",
                        selection: Binding(
                            get: { viewModel.task?.scheduled_date ?? Date() },
                            set: { newValue in viewModel.task?.scheduled_date = newValue }
                        ),
                        displayedComponents: [.date]
                    )
                    Button("Clear Date") {
                        viewModel.task?.scheduled_date = nil
                    }
                }
            }
            Button(action: {
                viewModel.handleUpdateTask()
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

struct EditTaskView_Preview: PreviewProvider {
    static var mockViewModel: TaskViewModel = getTestTaskViewModel()

    static var previews: some View {
        EditTaskView(
            viewModel: mockViewModel,
            onSave: {
                print("New card added")
            }
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Optional: improve appearance in the preview
    }
}
