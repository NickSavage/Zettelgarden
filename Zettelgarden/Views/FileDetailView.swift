import SwiftUI
import PDFKit

struct FileDetailView: View {
    let fileURL: URL

    var body: some View {
        if fileURL.pathExtension.lowercased() == "pdf" {
            PDFKitView(url: fileURL)
        } else if ["jpg", "jpeg", "png"].contains(fileURL.pathExtension.lowercased()) {
            ImageView(url: fileURL)
        } else {
            Text("Unsupported file type")
        }
    }
}

struct PDFKitView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.document = PDFDocument(url: url)
        return pdfView
    }

    func updateUIView(_ uiView: PDFView, context: Context) {
        // Update the view
    }
}

struct ImageView: View {
    let url: URL

    var body: some View {
        if let imageData = try? Data(contentsOf: url), let uiImage = UIImage(data: imageData) {
            Image(uiImage: uiImage)
                .resizable()
                .scaledToFit()
        } else {
            Text("Unable to load image")
        }
    }
}
