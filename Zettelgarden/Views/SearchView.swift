import SwiftUI

struct SearchView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @StateObject private var viewModel = SearchViewModel()
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
                        CardListItem(card: cardToPartialCard(card: card), cardViewModel: cardViewModel)
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

        var body: some View {
            SearchView(cardViewModel: cardViewModel)
        }
    }
}

