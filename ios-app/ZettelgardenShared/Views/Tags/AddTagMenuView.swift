//
//  AddTagMenuView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-10-07.
//

import SwiftUI

public struct AddTagMenuView: View {
    var onSelect: (_ tag: String) -> Void
    @State private var newTag: String = ""
    @EnvironmentObject var taskListViewModel: TaskListViewModel

    private func filteredTags() -> [String] {
        return taskListViewModel.existingTags
    }

    public init(
        onSelect: @escaping (_ tagName: String) -> Void
    ) {
        self.onSelect = onSelect

    }
    private func addNewTag() {
        var trimmedTag = newTag.trimmingCharacters(in: .whitespacesAndNewlines)

        if !trimmedTag.hasPrefix("#") {
            trimmedTag = "#\(trimmedTag)"
        }

        if !trimmedTag.isEmpty {
            self.onSelect(trimmedTag)
            newTag = ""
        }
    }

    private func selectTag(_ tagName: String) {
        self.onSelect(tagName)
    }

    public var body: some View {
        VStack {

            TextField("Enter new tag", text: $newTag, onCommit: addNewTag)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            ForEach(filteredTags(), id: \.self) { tag in
                Button(action: {
                    selectTag(tag)
                }) {
                    Text(tag)
                }
                .padding(.vertical, 2)  // Add some vertical padding between buttons
            }

        }
    }
}
