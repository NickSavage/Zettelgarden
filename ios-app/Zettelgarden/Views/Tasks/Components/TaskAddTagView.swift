import SwiftUI
import ZettelgardenShared

struct TaskAddTagView: View {

    @StateObject var taskViewModel: TaskViewModel
    @StateObject var taskListViewModel: TaskListViewModel
    @Binding var isPresented: Bool

    private func filteredTags() -> [String] {
        return taskListViewModel.existingTags.filter { !taskViewModel.tags.contains($0) }
    }

    var body: some View {
        VStack {
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
