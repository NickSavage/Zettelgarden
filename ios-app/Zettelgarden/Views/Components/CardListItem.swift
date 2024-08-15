//
//  CardListItem.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct CardListItem: View {
    let card: PartialCard
    @ObservedObject var navigationViewModel: NavigationViewModel

    var body: some View {
        VStack {
            Button(action: {
                navigationViewModel.visit(page: .card, cardPK: card.id)
            }) {
                HStack {
                    Text(card.card_id).foregroundColor(.blue)
                    Text(" - ")
                    Text(card.title).foregroundColor(.black)
                    Spacer()
                }.bold()
            }
        }
    }
}
