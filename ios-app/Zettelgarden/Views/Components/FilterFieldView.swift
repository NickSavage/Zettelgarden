//
//  FilterFieldView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-17.
//

import SwiftUI

struct FilterFieldView: View {
    @Binding var filterText: String
    var placeholder: String
    var onSubmit: (() -> Void)?

    var body: some View {
        HStack {
            TextField(placeholder, text: $filterText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .onSubmit { onSubmit?() }
            if filterText != "" {
                Button(action: { filterText = "" }) {
                    Text("Cancel")
                }
            }
        }
        .padding()
    }
}
