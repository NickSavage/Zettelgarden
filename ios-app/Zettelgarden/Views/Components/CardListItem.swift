//
//  CardListItem.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI
import ZettelgardenShared

struct CardListItem: View {
    let card: PartialCard
    @EnvironmentObject var navigationViewModel: NavigationViewModel

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

struct CardListItem_Previews: PreviewProvider {
    static var previews: some View {
        let mockCard = PartialCard.sampleData[0]
        let mockNavigationViewModel = getTestNavigationViewModel()

        // Return a preview of the CardListItem with the mock data
        return CardListItem(card: mockCard)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
