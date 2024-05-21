import SwiftUI

struct CardListView: View {
    @AppStorage("jwt") private var token: String?
    @State private var cards: [PartialCard] = []
    @State private var errorMessage: String?
    @State private var selectedFilter: CardFilterOption = .all
    @State private var filterText: String = ""

    @StateObject private var viewModel = PartialCardViewModel()

    var body: some View {
        NavigationStack {
            VStack {
                FilterFieldView(filterText: $filterText, placeholder: "Filter")
                if viewModel.isLoading {
                    ProgressView("Loading")

                }
                else if let cards = viewModel.cards {
                    List {
                        ForEach(cards) { card in
                            NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                                CardListItem(card: card)
                            }
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Picker("Filter", selection: $selectedFilter) {
                        ForEach(CardFilterOption.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    QuickAddMenu(
                        onAdd: viewModel.loadCards
                    )
                }
            }
        }
        .onAppear {
            //  loadCards()
            viewModel.loadCards()
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
        }
        else if filterText.hasPrefix("!") {
            return filteredByType.filter { $0.card_id.hasPrefix(filterText) }
        }
        else {
            return filteredByType.filter {
                $0.card_id.lowercased().contains(filterText.lowercased())
                    || $0.title.lowercased().contains(filterText.lowercased())
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
