import SwiftUI
import ZettelgardenShared

struct TaskAddTagView: View {

    @StateObject var taskViewModel: TaskViewModel
    @StateObject var taskListViewModel: TaskListViewModel
    @Binding var isPresented: Bool

    private func onSelect(_ tagName: String) {
        taskViewModel.addTag(tag: tagName)
        isPresented = false
    }

    var body: some View {
        VStack {
            AddTagMenuView(onSelect: onSelect)

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
