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
                //   print(self.files)
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
}
