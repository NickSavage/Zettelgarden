import SwiftUI
import ZettelgardenShared

struct EditCardContextMenu: View {
    @Binding var showDeleteAlert: Bool
    @Binding var isBacklinkInputPresented: Bool

    var body: some View {
        Group {
            Button(action: {
                isBacklinkInputPresented.toggle()
            }) {
                Text("Add Backlink")
            }
            Button(action: {
                showDeleteAlert = true
            }) {
                Text("Delete Card")
            }
        }
    }
}
