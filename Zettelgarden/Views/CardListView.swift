import SwiftUI

struct CardListView: View {
    @State private var errorMessage: String?
    @StateObject private var viewModel = PartialCardViewModel()

    var body: some View {
        NavigationStack {
            VStack {
                FilterFieldView(filterText: $viewModel.filterText, placeholder: "Filter")
                if viewModel.isLoading {
                    ProgressView("Loading")
                }
                else if let _ = viewModel.cards {
                    List {
                        ForEach(viewModel.filteredCards) { card in
                            NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                                CardListItem(card: card)
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
        .onAppear {
            viewModel.displayOnlyTopLevel = true
            viewModel.loadCards()
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
