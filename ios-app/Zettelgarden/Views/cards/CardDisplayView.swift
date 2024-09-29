import SwiftUI
import ZettelgardenShared

struct CardDisplayView: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var cardViewModel: CardViewModel
    @EnvironmentObject var navigationViewModel: NavigationViewModel

    @State private var showChildren = false
    @State private var showReferences = false
    @State private var showFiles = false

    @State private var showingAddCardView = false
    @State private var isPresentingEditView = false
    @State private var isBacklinkInputPresented = false
    @State private var showAddTagsSheet = false

    @EnvironmentObject var fileListViewModel: FileListViewModel
    @State private var fileURL: URL?
    @State private var isPresentingUploadFileView = false
    @State private var selectedImage: UIImage?
    @State private var isPresentingUploadPhotoView = false

    var body: some View {
        VStack(alignment: .leading) {

            if let card = cardViewModel.card {
                HStack {
                    Text(card.card_id).foregroundColor(.blue)
                    Text(" - ")
                    Text(card.title)
                    Spacer()
                    Menu {
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
                            showingAddCardView = true
                        }) {
                            Text("Add Child Card")

                        }
                        Button(action: {
                            isPresentingEditView = true
                        }) {
                            Text("Edit Card")
                        }
                        Button(action: {
                            isPresentingUploadFileView = true
                        }) {
                            Text("Upload File To Card")
                        }
                        Button(action: {
                            isPresentingUploadPhotoView = true
                        }) {
                            Text("Upload Photo To Card")
                        }

                    } label: {
                        Text("Actions")
                    }
                }
                .bold()
                .padding()
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
                                ForEach(
                                    card.references
                                        .sorted { compareCardIds($0.card_id, $1.card_id) }
                                ) { childCard in
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
                            Text(
                                "Children (\(card.children.filter { $0.parent_id == card.id }.count))"
                            ).bold()
                                .foregroundColor(.primary)
                        }
                        if showChildren {
                            LazyVStack(alignment: .leading) {
                                ForEach(
                                    card.children.filter { $0.parent_id == card.id }
                                        .sorted { compareCardIds($0.card_id, $1.card_id) }
                                ) { childCard in
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
                .sheet(isPresented: $isBacklinkInputPresented) {
                    if let unwrappedCard = cardViewModel.card {
                        BacklinkInputView(
                            onCardSelect: { selectedCard in
                                var editedCard = unwrappedCard
                                editedCard.body = editedCard.body + "\n\n[\(selectedCard.card_id)]"
                                cardViewModel.card = editedCard
                                cardViewModel.saveCard()
                                isBacklinkInputPresented = false
                            }
                        )
                        .presentationDetents([.medium, .large])
                    }
                }
                .sheet(isPresented: $showAddTagsSheet) {

                    if let unwrappedCard = cardViewModel.card {
                        AddCardTagsView(
                            onTagSelect: { tag in
                                var editedCard = unwrappedCard
                                editedCard.body = editedCard.body + "\n\n#\(tag.name)"
                                cardViewModel.card = editedCard
                                cardViewModel.saveCard()
                                showAddTagsSheet = false
                            }
                        )
                        .presentationDetents([.medium, .large])

                    }
                }
                .sheet(
                    isPresented: $isPresentingUploadFileView,

                    onDismiss: {
                        if let url = fileURL {
                            fileListViewModel.uploadFile(url: url, cardPK: card.id)
                        }
                    }
                ) {
                    DocumentPicker(fileURL: $fileURL)
                }
                .sheet(
                    isPresented: $isPresentingUploadPhotoView,
                    onDismiss: {
                        if let image = selectedImage {
                            fileListViewModel.uploadImage(image: image, cardPK: card.id)
                        }
                    }
                ) {
                    PhotoPicker(image: $selectedImage)
                }
                .sheet(isPresented: $showingAddCardView) {
                    if let card = cardViewModel.card {
                        AddCardView(card_id: card.card_id)
                    }
                }

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
    static var mockCardViewModel: CardViewModel {
        let card = Card.sampleData[0]
        let viewModel = CardViewModel()
        viewModel.card = card  // Assign sample card to your viewModel
        return viewModel
    }

    static var previews: some View {

        // Return a preview of the CardListItem with the mock data
        return CardDisplayView()
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
            .environmentObject(mockCardViewModel)
    }

}
