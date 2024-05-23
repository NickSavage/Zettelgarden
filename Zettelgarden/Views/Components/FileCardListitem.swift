import SwiftUI

struct FileCardListItem: View {
    let file: File
    @StateObject private var viewModel: FileViewModel
    @AppStorage("jwt") private var token: String?
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
                Text(String(file.id))
                Text(file.name)
                    .foregroundColor(.black)
                    .bold()
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
          //  if let card = viewModel.file.card {
            //    NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
              //      CardListItem(card: card)
                //}
            //}
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
