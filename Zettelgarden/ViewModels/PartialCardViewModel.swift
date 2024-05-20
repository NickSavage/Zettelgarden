//
//  PartialCardViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI

class PartialCardViewModel: ObservableObject {
    @Published var cards: [PartialCard]?
    @Published var isLoading: Bool = true
    @AppStorage("jwt") private var token: String?

    func loadCards() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        fetchPartialCards(token: token) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCards):
                    self.cards = fetchedCards
                case .failure(let error):
                    print("Unable to load card: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
    }

}
