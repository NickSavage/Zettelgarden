//
//  QuickAddMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-19.
//

import SwiftUI

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
            CardEditView(
                card: $newCard,
                onSave: { _ in
                    onAdd?()
                },
                isNew: true
            )
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

struct QuickAddMenu_Previews: PreviewProvider {
    static var previews: some View {
        QuickAddMenu()
    }
}
