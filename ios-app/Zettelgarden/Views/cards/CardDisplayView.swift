import SwiftUI
import ZettelgardenShared

struct CardDisplayView: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var cardViewModel: CardViewModel
    @EnvironmentObject var navigationViewModel: NavigationViewModel
    @State private var isPresentingEditView = false
    @State private var showChildren = false
    @State private var showReferences = false
    @State private var showFiles = false

    var body: some View {
        VStack(alignment: .leading) {

            if let card = cardViewModel.card {
                HStack {
                    Text(card.card_id).foregroundColor(.blue)
                    Text(" - ")
                    Text(card.title)
                    Spacer()
                    Button(action: {
                        isPresentingEditView = true
                    }) {
                        Image(systemName: "pencil")
                    }
                }
                .bold()
                .padding()
                TabView {

                    ScrollView {

                        VStack(alignment: .leading) {
                            Text(card.body).padding()
                            Spacer()
                            VStack {
                                if let parentCard = card.parent {
                                    Text("Parent").bold()
                                    CardListItem(
                                        card: parentCard
                                    )
                                }
                            }.padding()

                            VStack(alignment: .leading) {

                                HStack {
                                    ForEach(card.tags, id: \.id) { tag in
                                        Button(action: {
                                        }) {
                                            Text(tag.name)
                                                .padding(8)
                                                .background(Color.purple.opacity(0.2))
                                                .foregroundColor(.purple)
                                                .cornerRadius(8)
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                    }
                                }
                                Text("Created at: \(card.created_at, style: .date)")
                                Text("Updated at: \(card.updated_at, style: .date)")
                            }
                            .padding()
                            Button(action: {
                                showReferences.toggle()
                            }) {
                                Text("References (\(card.references.count))").bold()
                                    .foregroundColor(.primary)
                            }
                            if showReferences {
                                LazyVStack(alignment: .leading) {
                                    ForEach(card.references.reversed()) { childCard in
                                        CardListItem(
                                            card: childCard
                                        )
                                        .padding()
                                    }
                                }
                            }
                            Button(action: {
                                showChildren.toggle()
                            }) {
                                Text("Children (\(card.children.count))").bold()
                                    .foregroundColor(.primary)
                            }
                            if showChildren {
                                LazyVStack(alignment: .leading) {
                                    ForEach(card.children.reversed()) { childCard in
                                        CardListItem(
                                            card: childCard
                                        )
                                        .padding()
                                    }
                                }
                            }
                            Button(action: {
                                showFiles.toggle()
                            }) {
                                Text("Files (\(card.files.count))").bold()
                                    .foregroundColor(.primary)
                            }
                            if showFiles {
                                LazyVStack(alignment: .leading) {
                                    ForEach(card.files) { file in
                                        FileCardListItem(file: file)
                                            .padding()
                                    }
                                }
                            }
                        }
                    }
                    VStack {
                        Text("Files").bold()
                        List(card.files) { file in
                            FileCardListItem(file: file)
                        }
                    }
                }
                .tabViewStyle(PageTabViewStyle())
            }
            else {
                Text("No card available")
            }
        }
        .sheet(isPresented: $isPresentingEditView) {
            EditCardView()
        }
    }
}

struct CardDisplayView_Previews: PreviewProvider {
    static var previews: some View {

        // Return a preview of the CardListItem with the mock data
        return CardDisplayView()
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
