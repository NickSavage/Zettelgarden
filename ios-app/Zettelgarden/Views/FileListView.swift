//
//  FileListView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI

struct FileListView: View {
    @ObservedObject var viewModel = FileListViewModel()

    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView("Loading")
            } else if let files = viewModel.files {
                List {
                    ForEach(files) { file in
                        FileCardListItem(file: file)
                    }
                }
                .refreshable { viewModel.loadFiles() }

            }
        }
        .onAppear { viewModel.loadFiles() }
    }
}

#Preview {
    FileListView()
}
