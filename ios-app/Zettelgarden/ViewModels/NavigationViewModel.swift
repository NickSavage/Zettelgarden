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

    func previousVisit() {

    }
    func nextVisit() {

    }

    func visit(page: ContentViewSelection, cardPK: Int = -1) {
        currentIndex += 1
        selection = page
        if cardPK != -1 {
            history.append(Visit(view: page, cardPK: cardPK))
            //            cardViewModel.loadCard(cardPK: cardPK)
        }
        else {
            history.append(Visit(view: page))
        }
    }

}
