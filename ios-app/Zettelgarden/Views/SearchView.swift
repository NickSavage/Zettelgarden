import SwiftUI

struct SearchView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
    @ObservedObject var viewModel = SearchViewModel()
    @State private var newCard = Card.emptyCard

    var body: some View {
        NavigationView {  // Add NavigationView here
            VStack {
                FilterFieldView(
                    filterText: $viewModel.searchString,
                    placeholder: "Search",
                    onSubmit: viewModel.search
                )
                if viewModel.isLoading {
                    ProgressView("Searching...")
                }
                else {
                    List(viewModel.searchResults) { card in
                        Button(action: {
                            cardViewModel.loadCard(cardPK: card.id)
                            navigationViewModel.selection = .card
                        }) {
                            CardListItem(
                                card: cardToPartialCard(card: card),
                                navigationViewModel: navigationViewModel
                            )
                        }
                    }
                }

                Spacer()
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
