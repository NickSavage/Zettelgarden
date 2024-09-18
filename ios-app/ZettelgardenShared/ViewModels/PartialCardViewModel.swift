import Combine
import Foundation
import SwiftUI

public class PartialCardViewModel: ObservableObject {
    @Published public var cards: [PartialCard]?

    @Published public var isLoading: Bool = true
    @Published public var selectedFilter: CardFilterOption = .all
    @Published public var filterText: String = ""

    @Published public var inactive: Bool = false
    @Published public var sort: String = ""

    @Published public var displayOnlyTopLevel: Bool = false

    private var timer: Timer?

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?
    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    public init() {
        loadCards()
    }

    public var filteredCards: [PartialCard] {
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

    public func loadCards() {
        guard let token = token else {
            return
        }
        let session = openSession(token: token, environment: environment)
        fetchPartialCards(session: session, sort: sort, inactive: inactive) { result in
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

    public func loadTestCards(cards: [PartialCard]) {
        self.cards = cards
    }

    public func createNewCard(card: Card) {
        guard let token = token else {
            return
        }
        let session = openSession(token: token, environment: environment)

        saveNewCard(session: session, card: card) { result in
            switch result {
            case .success(let savedCard):
                print("success!")
            case .failure(let error):
                print("Failed to save new card: \(error)")
            }
        }

    }

    public func onScenePhaseChanged(to newPhase: ScenePhase) {
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

public enum CardFilterOption: Int, CaseIterable, Identifiable {
    case all = 1
    case meeting = 2
    case reference = 3
    case work = 4
    case unsorted = 5

    public var id: Int { self.rawValue }
    public var title: String {
        switch self {
        case .all:
            return "All Cards"
        case .meeting:
            return "Meeting Cards"
        case .reference:
            return "Reference Cards"
        case .work:
            return "Work Cards"
        case .unsorted:
            return "Unsorted"
        }
    }
}
