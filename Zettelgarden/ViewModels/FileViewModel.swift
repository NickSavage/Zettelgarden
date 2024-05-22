//
//  FileViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

class FileViewModel: ObservableObject {
    var file: File
    @AppStorage("jwt") private var token: String?
    @Published var identifiableFileURL: IdentifiableURL?
    @Published var isDownloading = false
    @Published var downloadError: Error?

    init(file: File) {
        self.file = file
    }
    func downloadFile() {

        guard let token = token else {
            self.downloadError = NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No token found"])
            return
        }
        
        isDownloading = true
        fetchFile(token: token, fileId: file.id, originalFileName: file.filename) { result in
            DispatchQueue.main.async {
                self.isDownloading = false
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
