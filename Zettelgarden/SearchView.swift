import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    
    var body: some View {
        NavigationView { // Add NavigationView here
            VStack {
                TextField("Search", text: $viewModel.searchString, onCommit: {
                    viewModel.search()
                })
                .clearButton(text: $viewModel.searchString)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding() // Add padding to the TextField

                if viewModel.isLoading {
                    ProgressView("Searching...")
                } else {
                    List(viewModel.searchResults) { card in
                        NavigationLink(destination: CardView(cardPK: card.id)) {
                            CardListItem(card: cardToPartialCard(card: card))
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
        SearchView()
    }
}
