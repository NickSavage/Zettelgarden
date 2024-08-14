//
//  HomeView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

struct HomeView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
    @ObservedObject var partialViewModel: PartialCardViewModel
    var body: some View {
        VStack {
            CardListView(
                cardViewModel: cardViewModel,
                navigationViewModel: navigationViewModel,
                viewModel: partialViewModel
            )
        }
    }
}
