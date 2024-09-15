import Foundation
import SwiftUI
import ZettelgardenShared

struct ShareContentView: View {
    var extensionContext: NSExtensionContext?
    @State var data: [NSItemProvider]?
    @State private var selectedTab = 0

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
    }
}
