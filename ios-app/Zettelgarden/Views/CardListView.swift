import SwiftUI

struct CardListView: View {
    @State private var errorMessage: String?
    @State private var isInitialized: Bool = false
    @Binding var isMenuOpen: Bool
    @Binding var selection: ContentViewSelection
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var viewModel: PartialCardViewModel

    var body: some View {
        VStack {
            FilterFieldView(filterText: $viewModel.filterText, placeholder: "Filter")
            if viewModel.isLoading {
                ProgressView("Loading")
            }
            else if let _ = viewModel.cards {

                List {
                    ForEach(viewModel.filteredCards) { card in
                        Button(action: {
                            print(card.card_id)
                            cardViewModel.loadCard(cardPK: card.id)
                            isMenuOpen.toggle()
                            selection = .card
                        }) {
                            CardListItem(card: card, cardViewModel: cardViewModel)
                        }
                    }
                }
                .refreshable {
                    viewModel.loadCards()
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Picker("Filter", selection: $viewModel.selectedFilter) {
                    ForEach(CardFilterOption.allCases) { option in
                        Text(option.title).tag(option)
                    }
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

struct CardList_Previews: PreviewProvider {
    static var previews: some View {
        CardListViewWrapper()
    }

    struct CardListViewWrapper: View {
        @State private var isMenuOpen = true
        @State private var selectedCard: Int? = 1
        @State private var selection: ContentViewSelection = .home
        @ObservedObject var cardViewModel = CardViewModel()
        @StateObject var viewModel = PartialCardViewModel()

        var body: some View {
            CardListView(
                isMenuOpen: $isMenuOpen,
                selection: $selection,
                cardViewModel: cardViewModel,
                viewModel: viewModel
            )
        }
    }
}
