//
//  HomeView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

struct HomeView: View {
    @StateObject private var inactiveModel = PartialCardViewModel()
    var body: some View {
        NavigationStack {
            Text("Inactive Cards").bold()
            if inactiveModel.isLoading {
                ProgressView("Loading")
            }
            else if let cards = inactiveModel.cards {
                List {
                    ForEach(cards.prefix(10)) { card in
                        NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                            CardListItem(card: card)
                        }

                    }
                }

            }
        }
        .onAppear {
            inactiveModel.inactive = true
            inactiveModel.loadCards()
        }
    }

}

#Preview {
    HomeView()
}
