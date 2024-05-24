//
//  HomeView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

struct HomeView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @StateObject private var recentModel = PartialCardViewModel()
    var body: some View {
        VStack {
            Text("Recent Cards")

            HStack {
                Text("hi")
                Spacer()

            }
            if recentModel.isLoading {
                ProgressView("Loading")
            }
            else if let cards = recentModel.cards {
                Text("hi")
                List {
                    ForEach(cards.prefix(10)) { card in
                        CardListItem(card: card, cardViewModel: cardViewModel)
                    }
                }
            }
            Spacer()
        }
        .onAppear {
            recentModel.sort = "date"
            recentModel.loadCards()
        }
        //     NavigationStack {
        //         Text("recent Cards").bold()

        //         }
        //     }
        // }

    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeViewWrapper()
    }

    struct HomeViewWrapper: View {
        @ObservedObject var cardViewModel = CardViewModel()

        var body: some View {
            HomeView(cardViewModel: cardViewModel)
        }
    }
}
