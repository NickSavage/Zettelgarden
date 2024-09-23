//
//  FileListViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import Combine
import Foundation
import SwiftUI
import ZettelgardenShared

public class FileListViewModel: ObservableObject {
    @Published public var files: [File]?
    @Published public var isLoading = true
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }
    public init() {}
    public func loadFiles() {
        guard let token = token else {
            print("Token is missing")
            return
        }

        let session = openSession(token: token, environment: environment)
        fetchFiles(session: session) { results in
            DispatchQueue.main.async {
                switch results {
                case .success(let fetchedFiles):
                    self.files = self.sortFiles(fetchedFiles)
                //   pint(self.files)
                case .failure(let error):
                    print("Unable to load files: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }

    }
    private func sortFiles(_ files: [File]) -> [File] {
        return files.sorted { $0.id > $1.id }
    }
    public func uploadImage(image: UIImage, cardPK: Int) {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            print("Failed to convert image to data.")
            return
        }

        // Save image data to a temporary file URL
        let tempDirectory = FileManager.default.temporaryDirectory
        let imageURL = tempDirectory.appendingPathComponent("tempImage.jpg")

        do {
            try imageData.write(to: imageURL, options: .atomic)
            uploadFile(url: imageURL, cardPK: cardPK)  // Call the upload function
        }
        catch {
            print("Failed to write image data to file: \(error)")
        }
    }

    public func uploadFile(url: URL, cardPK: Int) {
        let session = openSession(token: token, environment: environment)
        print("?")
        uploadFileImplementation(fileURL: url, cardPK: cardPK, session: session) { result in
            switch result {
            case .success(let response):
                print("Upload successful: \(response.message)")
            // Handle success, maybe update your UI or notify user

            case .failure(let error):
                print("Upload failed: \(error.localizedDescription)")
            // Handle error, show an alert or notify user
            }
        }
    }
}
