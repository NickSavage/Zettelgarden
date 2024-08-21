//
//  FileListViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import Combine
import Foundation
import SwiftUI

class FileListViewModel: ObservableObject {
    @Published var files: [File]?
    @Published var isLoading = true
    @AppStorage("jwt", store: UserDefaults(suiteName: "com.zettelgarden.sharedSuite")) private
        var token: String?

    func loadFiles() {
        guard let token = token else {
            print("Token is missing")
            return
        }

        fetchFiles(token: token) { results in
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
