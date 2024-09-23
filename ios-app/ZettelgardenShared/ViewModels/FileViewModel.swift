//
//  FileViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI
import ZettelgardenShared

public class FileViewModel: ObservableObject {
    public var file: File
    @Published public var identifiableFileURL: IdentifiableURL?
    @Published public var isDownloading = false
    @Published public var downloadError: Error?

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?
    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }
    public init(file: File) {
        self.file = file
    }
    public func downloadFile() {

        guard let token = token else {
            print("Token is missing")
            return
        }

        isDownloading = true
        let session = openSession(token: token, environment: environment)
        fetchFile(session: session, fileId: file.id, originalFileName: file.filename) { result in
            DispatchQueue.main.async {
                self.isDownloading = false
                switch result {
                case .success(let url):
                    self.identifiableFileURL = IdentifiableURL(url: url)
                case .failure(let error):
                    print(error)
                    self.downloadError = error
                }
            }
        }
    }

    public func renameFile(newName: String) {
        var editedFile = file
        editedFile.name = newName
        print("new nane \(newName)")
        editFile(editedFile: editedFile)

    }

    public func editFile(editedFile: File) {
        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)
        file = editedFile
        print("?")
        editFileImplementation(session: session, file: editedFile) { result in
            switch result {
            case .success(let savedFile):
                print("success!")
            case .failure(let error):
                print("Failed to save existing file: \(error)")
            }
        }

    }
}
