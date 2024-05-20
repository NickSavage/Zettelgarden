import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    @State private var isPresentingNewCardView = false
    @State private var newCard = Card.emptyCard
    
    var body: some View {
        NavigationView { // Add NavigationView here
            VStack {
                FilterFieldView(filterText: $viewModel.searchString, placeholder: "Search")
                if viewModel.isLoading {
                    ProgressView("Searching...")
                } else {
                    List(viewModel.searchResults) { card in
                        NavigationLink(destination: CardDisplayView(cardPK: card.id)) {
                            CardListItem(card: cardToPartialCard(card: card))
                        }
                    }
                }
                
                Spacer()
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            QuickAddMenu(newCard: $newCard, isPresentingNewCardView: $isPresentingNewCardView)
            }
        }
        .sheet(isPresented: $isPresentingNewCardView) {
            CardEditView(card: $newCard, onSave: { _ in
                isPresentingNewCardView = false
            }, isNew: true)
        }    
    }
}

struct SearchView_Previews: PreviewProvider {
    static var previews: some View {
        SearchView()
    }
}
