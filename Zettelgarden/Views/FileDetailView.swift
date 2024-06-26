import PDFKit
import SwiftUI

struct FileDetailView: View {
    let file: File
    let fileURL: URL
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack {
            HStack {
                Text(file.name)
                .lineLimit(1)
                .truncationMode(.tail)
                .padding()
                Spacer()
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .resizable()
                        .frame(width: 24, height: 24)
                        .foregroundColor(.gray)
                }
                .padding()
            }
            if fileURL.pathExtension.lowercased() == "pdf" {
                PDFKitView(url: fileURL)
            }
            else if ["jpg", "jpeg", "png"].contains(fileURL.pathExtension.lowercased()) {
                ImageView(url: fileURL)
            }
            else {
                Text("Unsupported file type")
            }
            Spacer()
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
        }
        else {
            Text("Unable to load image")
        }
    }
}
