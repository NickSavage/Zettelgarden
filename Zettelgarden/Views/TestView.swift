//
//  TestView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-23.
//

import SwiftUI

struct TestView: View {

    @ObservedObject var viewModel = CardViewModel()
    let cardPK: Int?

    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView("Loading")
            }
            else if let card = viewModel.card {
                Text(card.title)
            }
            else {
                Text("No card")
            }
        }
        .onAppear {
            if let x = cardPK {
                viewModel.loadCard(cardPK: x)
            }
        }
        .onChange(of: cardPK) { newCardPK in
            if let x = newCardPK {
                viewModel.loadCard(cardPK: x)
            }
        }
    }
}
