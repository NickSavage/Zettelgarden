import SwiftUI
import ZettelgardenShared

struct FileCardListItem: View {
    let file: File
    @StateObject private var viewModel: FileViewModel
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var jwt: String?
    @State private var identifiableFileURL: IdentifiableURL?
    @State private var isDownloading = false
    @State private var downloadError: Error?

    init(file: File) {
        self.file = file
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
                    // NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                    //     CardListItem(card: card)
                    // }
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
