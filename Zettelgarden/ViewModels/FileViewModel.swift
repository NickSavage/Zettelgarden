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
    @State private var identifiableFileURL: IdentifiableURL?
    @State private var isDownloading = false
    @State private var downloadError: Error?

    init(file: File) {
        self.file = file
    }
    func test() {
        print("test!")
    }
}
