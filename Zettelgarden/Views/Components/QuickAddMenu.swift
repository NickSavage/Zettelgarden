//
//  QuickAddMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-19.
//

import SwiftUI

struct QuickAddMenu: View {
    @Binding var newCard: Card
    @Binding var isPresentingNewCardView: Bool

    var body: some View {
        Menu {
            Button("New Card", action: handleNewCard)
            Button("New Reference Card", action: handleReferenceCard)
            Button("New Meeting Card", action: handleMeetingCard)
        } label: {
            Image(systemName: "plus")
        }
    }
    private func handleNewCard() {
        newCard = Card.emptyCard
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
    struct PreviewWrapper: View {
        @State var newCard: Card = Card.emptyCard
        @State var isPresentingNewCardView: Bool = false

        var body: some View {
            QuickAddMenu(newCard: $newCard, isPresentingNewCardView: $isPresentingNewCardView)
        }
    }

    static var previews: some View {
        PreviewWrapper()
    }
}
