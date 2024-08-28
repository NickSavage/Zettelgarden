import PDFKit
import SwiftUI
import ZettelgardenShared

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
            if file.filetype == "application/pdf" {
                PDFKitView(url: fileURL)
            }
            else if file.filetype == "image/png" || file.filetype == "image/jpeg" {
                ImageView(url: fileURL)
            }
            else {
                Text("Unsupported file type")
            }
            Spacer()
        }
        .onAppear {
            print(file)
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
