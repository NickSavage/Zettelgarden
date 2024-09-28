import Foundation
import SwiftUI
import ZettelgardenShared

struct ShareContentView: View {
    var extensionContext: NSExtensionContext?
    @State var data: [NSItemProvider]?
    @State private var selectedTab = 0

    @StateObject var taskListViewModel = TaskListViewModel()
    @StateObject var partialCardViewModel = PartialCardViewModel()
    @StateObject var navigationViewModel: NavigationViewModel
    @StateObject var cardViewModel = CardViewModel()

    init(extensionContext: NSExtensionContext?, data: [NSItemProvider]?) {
        self.extensionContext = extensionContext
        self.data = data
        let cardViewModel = CardViewModel()
        _navigationViewModel = StateObject(
            wrappedValue: NavigationViewModel(cardViewModel: cardViewModel)
        )
    }
    var body: some View {
        VStack {
            Picker("Options", selection: $selectedTab) {
                Text("Add Task").tag(0)
                Text("Add Card").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            if selectedTab == 0 {
                ShareAddTaskView(
                    extensionContext: extensionContext,
                    data: data
                )
            }
            else if selectedTab == 1 {
                ShareAddCardView(
                    extensionContext: extensionContext,
                    data: data
                )
            }
        }
        .padding()
        .environmentObject(partialCardViewModel)
        .environmentObject(navigationViewModel)
        .environmentObject(taskListViewModel)
    }
}
