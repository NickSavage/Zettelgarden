//
//  FileListView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI
import ZettelgardenShared

struct FileListView: View {
    @EnvironmentObject var fileListViewModel: FileListViewModel

    var body: some View {
        VStack {
            if fileListViewModel.isLoading {
                ProgressView("Loading")
            }
            else if let files = fileListViewModel.files {
                List {
                    ForEach(files) { file in
                        FileCardListItem(file: file)
                    }
                }
                .refreshable { fileListViewModel.loadFiles() }

            }
        }
        .onAppear { fileListViewModel.loadFiles() }
    }
}

struct FileListView_Previews: PreviewProvider {
    static var mockFileListViewModel: FileListViewModel {
        let viewModel = FileListViewModel()
        viewModel.files = File.sampleData
        return viewModel
    }

    static var previews: some View {
        return FileListView()
            .previewLayout(.sizeThatFits)
            .padding()
            .environmentObject(mockFileListViewModel)
    }
}
