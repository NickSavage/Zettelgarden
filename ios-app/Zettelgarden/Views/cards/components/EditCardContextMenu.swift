import SwiftUI
import ZettelgardenShared

struct EditCardContextMenu: View {
    @Binding var showDeleteAlert: Bool
    @Binding var isBacklinkInputPresented: Bool
    @Binding var showAddTagsSheet: Bool

    var body: some View {
        Group {
            Button(action: {
                isBacklinkInputPresented.toggle()
            }) {
                Text("Add Backlink")
            }
            Button(action: {
                showAddTagsSheet.toggle()
            }) {
                Text("Add Tags")
            }
            Button(action: {
                showDeleteAlert = true
            }) {
                Text("Delete Card")
            }
        }

        .sheet(isPresented: $showAddTagsSheet) {
            VStack {
                Text("asd")
            }
        }

        //.sheet(isPresented: $showAddTagsSheet) {

        //}
    }
}
