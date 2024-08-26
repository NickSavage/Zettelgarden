//
//  QuickAddMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-19.
//

import SwiftUI
import ZettelgardenShared

struct QuickAddMenu: View {
    @State var newCard: Card = Card.emptyCard
    @State var isPresentingNewCardView: Bool = false
    var onAdd: (() -> Void)?
    var currentCard: Card?

    var body: some View {
        Menu {
            Button("New Card", action: handleNewCard)
            Button("New Reference Card", action: handleReferenceCard)
            Button("New Meeting Card", action: handleMeetingCard)
        } label: {
            Image(systemName: "plus")
        }
        .sheet(isPresented: $isPresentingNewCardView) {
        }
    }
    private func handleNewCard() {
        newCard = Card.emptyCard
        if let current = currentCard {
            newCard.card_id = current.card_id
        }

        isPresentingNewCardView = true

    }
    private func handleReferenceCard() {
        newCard = Card.emptyCard
        isPresentingNewCardView = true
    }
    private func handleMeetingCard() {

        newCard = Card.emptyCard
        isPresentingNewCardView = true
    }
}
struct QuickAddMenu_Preview: PreviewProvider {
    static var previews: some View {
        QuickAddMenu(
            onAdd: {
                // Action to be triggered when a new card is added
                print("New card added")
            },
            currentCard: Card.emptyCard  // Assuming you want to pass an existing card
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Add some padding for better appearance in the preview
    }
}
