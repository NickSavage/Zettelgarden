import SwiftUI



struct CardListView: View {
    @AppStorage("jwt") private var token: String?
    @State private var cards: [PartialCard] = []
    @State private var isPresentingNewCardView = false
    @State private var newCard = Card.emptyCard
    @State private var errorMessage: String?
    @State private var selectedFilter: CardFilterOption = .all
    @State private var filterText: String = ""
    
    var body: some View {
        NavigationStack {
            FilterFieldView(filterText: $filterText, placeholder: "Filter")
            List(filteredCards) { card in
                NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                    CardListItem(card: card)
                }
            }
            .onAppear {
                loadCards()
            }
            .toolbar {
                Picker("Filter", selection: $selectedFilter) {
                    ForEach(CardFilterOption.allCases) { option in
                        Text(option.title).tag(option)
                    }
                }
                Button(action: {
                    newCard = Card.emptyCard
                    isPresentingNewCardView = true
                }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $isPresentingNewCardView) {
            CardEditView(card: $newCard, onSave: { _ in
                loadCards()
                isPresentingNewCardView = false
            }, isNew: true)
        }
    }

    private var filteredCards: [PartialCard] {
            let filteredByType: [PartialCard]
            
            switch selectedFilter {
            case .all:
                filteredByType = cards
            case .reference:
                filteredByType = cards.filter { $0.card_id.hasPrefix("REF") }
            case .meeting:
                filteredByType = cards.filter { $0.card_id.hasPrefix("MM") }
            case .work:
                filteredByType = cards.filter { $0.card_id.hasPrefix("SP") }
            case .unsorted:
                filteredByType = cards.filter { $0.card_id == "" }

            }

            if filterText.isEmpty {
                return filteredByType
            } else if filterText.hasPrefix("!") {
                return filteredByType.filter { $0.card_id.hasPrefix(filterText)}
            } else {
                return filteredByType.filter {
                    $0.card_id.lowercased().contains(filterText.lowercased()) ||
                                                     $0.title.lowercased().contains(filterText.lowercased())
                }
            }
        }

    private func loadCards() {
        guard let token = token else {
            errorMessage = "No token found. Please log in."
            return
        }

        fetchPartialCards(token: token, searchTerm: "") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCards):
                    self.cards = fetchedCards.filter { !$0.card_id.contains("/")}
                case .failure(let error):
                    self.errorMessage = "Error fetching cards: \(error.localizedDescription)"
                }
            }
        }
    }
}

enum CardFilterOption: Int, CaseIterable, Identifiable {
    case all = 1
    case meeting = 2
    case reference = 3
    case work = 4
    case unsorted = 5
    
    var id: Int { self.rawValue }
    var title: String {
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

struct CardList_Preview: PreviewProvider {
    static var previews: some View {
        CardListView()
    }
}
