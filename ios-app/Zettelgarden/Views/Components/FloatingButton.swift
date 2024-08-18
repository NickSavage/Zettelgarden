//
//  FloatingButton.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-18.
//

import SwiftUI

struct FloatingButton: View {
    var action: () -> Void
    var imageText: String
    var body: some View {

        Button(
            action: {
                action()
            },
            label: {
                Image(systemName: imageText)
                    .font(.title.weight(.semibold))
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .clipShape(Circle())
                    .shadow(radius: 4, x: 0, y: 4)
            }
        )
        .padding(7)
    }
}
