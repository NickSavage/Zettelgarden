//
//  CardListItem.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct CardListItem: View {
    let card: PartialCard
    @ObservedObject var cardViewModel: CardViewModel

    var body: some View {
        VStack {
            Button(action: {
                cardViewModel.loadCard(cardPK: card.id)
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

struct CardListItem_Previews: PreviewProvider {
    static var previews: some View {
        CardListItemWrapper()
    }

    struct CardListItemWrapper: View {
        var card = PartialCard.sampleData[0]
        @StateObject var cardViewModel = CardViewModel()

        var body: some View {
            CardListItem(card: card, cardViewModel: cardViewModel).previewLayout(.fixed(width: 400, height: 40))
        }

    }
}
