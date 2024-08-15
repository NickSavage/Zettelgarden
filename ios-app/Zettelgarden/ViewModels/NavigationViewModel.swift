//
//  NavigationViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-14.
//

import SwiftUI

class NavigationViewModel: ObservableObject {
    var history: [Visit] = []
    var currentIndex: Int = -1
    @Published var selection: ContentViewSelection = .tasks
    private var cardViewModel: CardViewModel

    init(cardViewModel: CardViewModel) {
        self.cardViewModel = cardViewModel
    }

    func previousVisit() {
        print(currentIndex)
        if currentIndex < 1 {
            print("cancelling prevoius")
            return
        }
        currentIndex -= 1

        selection = history[currentIndex].view
        if history[currentIndex].cardPK != -1 {
            cardViewModel.loadCard(cardPK: history[currentIndex].cardPK)
        }

    }
    func nextVisit() {
        print(currentIndex)
        if currentIndex >= history.count - 1 {
            print("cancelling next")
            return
        }

        currentIndex += 1
        selection = history[currentIndex].view
        if history[currentIndex].cardPK != -1 {
            cardViewModel.loadCard(cardPK: history[currentIndex].cardPK)
        }

    }

    func visit(page: ContentViewSelection, cardPK: Int = -1) {
        currentIndex += 1
        selection = page
        if cardPK != -1 {
            history.append(Visit(view: page, cardPK: cardPK))
            cardViewModel.loadCard(cardPK: cardPK)
        }
        else {
            var cardPK: Int
            if history.count > 0 {
                cardPK = history[currentIndex - 1].cardPK
            }
            else {
                cardPK = -1
            }
            history.append(Visit(view: page, cardPK: cardPK))
        }
        print(history)
    }

}
