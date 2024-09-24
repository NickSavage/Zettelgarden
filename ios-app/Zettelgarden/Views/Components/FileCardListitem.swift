import SwiftUI
import ZettelgardenShared

struct FileCardListItem: View {
    let file: File
    @StateObject private var viewModel: FileViewModel
    @EnvironmentObject private var fileListViewModel: FileListViewModel
    @EnvironmentObject private var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var navigationViewModel: NavigationViewModel

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var jwt: String?
    @State private var identifiableFileURL: IdentifiableURL?
    @State private var isDownloading = false
    @State private var downloadError: Error?

    @State private var isPresentingRenameFile = false
    @State private var newFileName: String = ""

    @State private var isPresentingDeleteFile = false
    @State private var isPresentingLinkFile = false

    init(file: File) {
        self.file = file
        self.newFileName = self.file.name
        _viewModel = StateObject(wrappedValue: FileViewModel(file: file))
    }

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Image(systemName: "doc")
                Text(file.name)
                    .foregroundColor(.black)
                    .bold()
                    .lineLimit(1)
                    .truncationMode(.tail)
                Spacer()
                if let card = viewModel.file.card {
                    Button(action: {
                    }) {
                        Text("[\(card.card_id)]")
                            .foregroundColor(.blue)
                            .bold()

                    }
                }
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 5)
        .onTapGesture {
            viewModel.downloadFile()
        }
        .sheet(item: $viewModel.identifiableFileURL) { identifiableURL in
            FileDetailView(file: file, fileURL: identifiableURL.url)
        }
        .alert(isPresented: .constant(viewModel.downloadError != nil)) {
            Alert(
                title: Text("Download Error"),
                message: Text(viewModel.downloadError?.localizedDescription ?? "Unknown error"),
                dismissButton: .default(Text("OK"))
            )
        }
        .alert(
            "Rename File",
            isPresented: $isPresentingRenameFile,
            actions: {

                TextField("Rename File", text: $newFileName)

                Button("Cancel", role: .cancel, action: {})
                Button(
                    "Save",
                    action: {
                        viewModel.renameFile(newName: newFileName)
                    }
                )
            }
        )
        .contextMenu {
            Group {
                Button(action: {
                    isPresentingRenameFile = true
                }) {
                    Text("Rename File")
                }
                Button(action: {
                    isPresentingDeleteFile = true
                }) {
                    Text("Delete File")
                }

                if file.card_pk > 0 {
                    Button(action: {
                        viewModel.unlinkFile()

                    }) {
                        Text("Unlink Card")
                    }

                }
                else {

                    Button(action: {
                        isPresentingLinkFile = true
                    }) {
                        Text("Link Card")
                    }
                }
            }
        }
        .sheet(isPresented: $isPresentingLinkFile) {
            BacklinkInputView(
                viewModel: partialCardViewModel,
                navigationViewModel: navigationViewModel,
                onCardSelect: { selectedCard in
                    viewModel.linkFileToCard(card: selectedCard)
                    isPresentingLinkFile = false
                }
            )
            .presentationDetents([.medium, .large])
        }
        .alert(isPresented: $isPresentingDeleteFile) {

            Alert(
                title: Text("Warning"),
                message: Text(
                    "Are you sure you want to delete this file? This action cannot be undone."
                ),
                primaryButton: .destructive(Text("Delete")) {
                    viewModel.deleteFile()
                },
                secondaryButton: .cancel()
            )
        }
    }

}

struct FileCardListItem_Preview: PreviewProvider {

    static var previews: some View {
        let mockFile = File.sampleData[0]
        let mockFileViewModel = FileViewModel(file: mockFile)

        // Return a preview of the CardListItem with the mock data
        return FileCardListItem(file: mockFile)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }
}
