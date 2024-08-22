import SwiftUI
import ZettelgardenShared

struct CardListView: View {
    @State private var errorMessage: String?
    @State private var isInitialized: Bool = false
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
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
                        CardListItem(
                            card: card,
                            navigationViewModel: navigationViewModel
                        )
                    }
                }
                .refreshable {
                    viewModel.loadCards()
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
