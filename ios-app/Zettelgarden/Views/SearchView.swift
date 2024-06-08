import SwiftUI

struct SearchView: View {
    @Binding var selection: ContentViewSelection
    @ObservedObject var cardViewModel: CardViewModel
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
                            selection = .card
                        }) {
                            CardListItem(
                                card: cardToPartialCard(card: card),
                                cardViewModel: cardViewModel
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

struct SearchView_Previews: PreviewProvider {
    static var previews: some View {
        SearchViewWrapper()
    }

    struct SearchViewWrapper: View {
        @ObservedObject var cardViewModel = CardViewModel()
        @State var selection: ContentViewSelection = .search

        var body: some View {
            SearchView(selection: $selection, cardViewModel: cardViewModel)
        }
    }
}
