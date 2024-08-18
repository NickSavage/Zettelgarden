import Combine
import Foundation
import SwiftUI

class PartialCardViewModel: ObservableObject {
    @Published var cards: [PartialCard]?

    @Published var isLoading: Bool = true
    @Published var selectedFilter: CardFilterOption = .all
    @Published var filterText: String = ""

    @Published var inactive: Bool = false
    @Published var sort: String = ""

    @Published var displayOnlyTopLevel: Bool = false

    private var refreshTimer: AnyCancellable?

    @AppStorage("jwt") private var token: String?

    init() {
        loadCards()
        refreshTimer = Timer.publish(every: 15, on: .main, in: .common)
            .autoconnect()
            .sink { _ in
                self.loadCards()
            }
    }

    var filteredCards: [PartialCard] {
        let filteredByType: [PartialCard]

        switch selectedFilter {
        case .all:
            filteredByType = cards ?? []
        case .reference:
            filteredByType = cards?.filter { $0.card_id.hasPrefix("REF") } ?? []
        case .meeting:
            filteredByType = cards?.filter { $0.card_id.hasPrefix("MM") } ?? []
        case .work:
            filteredByType = cards?.filter { $0.card_id.hasPrefix("SP") } ?? []
        case .unsorted:
            filteredByType = cards?.filter { $0.card_id == "" } ?? []
        }

        var result = filteredByType

        if displayOnlyTopLevel {
            result = result.filter { !$0.card_id.contains("/") }
        }

        if filterText.isEmpty {
            return result
        }
        else if filterText.hasPrefix("!") {
            return result.filter { $0.card_id.hasPrefix(filterText) }
        }
        else {
            return result.filter {
                $0.card_id.lowercased().contains(filterText.lowercased())
                    || $0.title.lowercased().contains(filterText.lowercased())
            }
        }
    }

    func loadCards() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        fetchPartialCards(token: token, sort: sort, inactive: inactive) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCards):
                    self.cards = fetchedCards
                    print("loaded")
                case .failure(let error):
                    print("Unable to load card: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
        print("loading cards")
    }
}
