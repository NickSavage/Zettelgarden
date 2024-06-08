//
//  TestView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-23.
//

import SwiftUI

struct TestView: View {

    @ObservedObject var viewModel: CardViewModel

    var body: some View {
        VStack {
            if let card = viewModel.card {
                Text(card.title)
            }
            else {
                Text("No card")
            }
        }
    }
}
