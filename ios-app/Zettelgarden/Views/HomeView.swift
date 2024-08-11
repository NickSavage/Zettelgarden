//
//  HomeView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

struct HomeView: View {
    @Binding var selection: ContentViewSelection
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var partialViewModel: PartialCardViewModel
    var body: some View {
        VStack {
          CardListView(
            selection: $selection,
            cardViewModel: cardViewModel,
            viewModel: partialViewModel
          )
        }
    }
}
