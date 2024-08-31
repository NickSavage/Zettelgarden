import SwiftUI
import ZettelgardenShared

struct TaskAddTagView: View {

    @StateObject var taskViewModel: TaskViewModel
    @StateObject var taskListViewModel: TaskListViewModel
    @Binding var isPresented: Bool
    @State private var newTag: String = ""

    private func filteredTags() -> [String] {
        return taskListViewModel.existingTags.filter { !taskViewModel.tags.contains($0) }
    }
    private func addNewTag() {
        var trimmedTag = newTag.trimmingCharacters(in: .whitespacesAndNewlines)

        if !trimmedTag.hasPrefix("#") {
            trimmedTag = "#\(trimmedTag)"
        }

        if !trimmedTag.isEmpty {
            taskViewModel.addTag(tag: trimmedTag)
            newTag = ""
            isPresented = false
        }
    }

    var body: some View {
        VStack {
            TextField("Enter new tag", text: $newTag, onCommit: addNewTag)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            ForEach(filteredTags(), id: \.self) { tag in
                Button(action: {
                    taskViewModel.addTag(tag: tag)
                    isPresented = false
                }) {
                    Text(tag)
                }
                .padding(.vertical, 2)  // Add some vertical padding between buttons
            }

        }
    }
}

struct TaskAddTagView_Preview: PreviewProvider {

    @State static var isPresented = true
    static var mockViewModel: TaskViewModel = getTestTaskViewModel()
    static var mockListViewModel: TaskListViewModel = getTestTaskListViewModel()

    static var previews: some View {
        TaskAddTagView(
            taskViewModel: mockViewModel,
            taskListViewModel: mockListViewModel,
            isPresented: $isPresented
        )
    }
}
