import SwiftUI

struct FileCardListItem: View {
    let file: File
    @AppStorage("jwt") private var token: String?
    @State private var identifiableFileURL: IdentifiableURL?
    @State private var isDownloading = false
    @State private var downloadError: Error?
    
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
            Text(file.filename)
                .foregroundColor(.blue)
                .bold()
                .lineLimit(1)
                .truncationMode(.tail)
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 5)
        .onTapGesture {
            downloadFile()
        }
        .sheet(item: $identifiableFileURL) { identifiableURL in
            FileDetailView(file: file, fileURL: identifiableURL.url)
        }
        .alert(isPresented: .constant(downloadError != nil)) {
            Alert(
                title: Text("Download Error"),
                message: Text(downloadError?.localizedDescription ?? "Unknown error"),
                dismissButton: .default(Text("OK"))
            )
        }
    }
    
    private func downloadFile() {

        guard let token = token else {
            self.downloadError = NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No token found"])
            return
        }
        
        isDownloading = true
        fetchFile(token: token, fileId: file.id, originalFileName: file.filename) { result in
            DispatchQueue.main.async {
                isDownloading = false
                switch result {
                case .success(let url):
                    self.identifiableFileURL = IdentifiableURL(url: url)
                case .failure(let error):
                    self.downloadError = error
                }
            }
        }
    }
}
