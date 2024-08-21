import Combine
import Foundation
import SwiftUI
import ZettelgardenShared

class PartialCardViewModel: ObservableObject {
    @Published var cards: [PartialCard]?

    @Published var isLoading: Bool = true
    @Published var selectedFilter: CardFilterOption = .all
    @Published var filterText: String = ""

    @Published var inactive: Bool = false
    @Published var sort: String = ""

    @Published var displayOnlyTopLevel: Bool = false

    private var timer: Timer?

    @AppStorage("jwt", store: UserDefaults(suiteName: "com.zettelgarden.sharedSuite")) private
        var token: String?

    init() {
        loadCards()
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
    }

    func onScenePhaseChanged(to newPhase: ScenePhase) {
        if newPhase == .active {
            self.loadCards()
            startTimer()
        }
        else {
            stopTimer()
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { _ in
            self.loadCards()
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}
