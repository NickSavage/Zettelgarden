import SwiftUI

struct CardListView: View {
    @AppStorage("jwt") private var token: String?
    @State private var cards: [Card] = []
    @State private var isPresentingNewCardView = false
    @State private var newCard = Card.emptyCard
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Text("Zettelgarden")
            Picker(selection: .constant(1), label: Text("Picker")) {
                Text("All Cards").tag(1)
                Text("Recent Cards").tag(2)
            }
            List(cards) { card in
                NavigationLink(destination: CardView(cardPK: card.id)) {
                    CardListItem(card: card)
                }
            }
            .onAppear {
                loadCards()
            }
            .toolbar {
                Button(action: {
                    newCard = Card.emptyCard
                    isPresentingNewCardView = true
                }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $isPresentingNewCardView) {
            CardEditView(card: $newCard, onSave: { newCard in
                cards.append(newCard)
                isPresentingNewCardView = false
            }, isNew: true)
        }
    }

    private func loadCards() {
        guard let token = token else {
            errorMessage = "No token found. Please log in."
            return
        }

        fetchCards(token: token, searchTerm: "") { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCards):
                    self.cards = fetchedCards
                case .failure(let error):
                    self.errorMessage = "Error fetching cards: \(error.localizedDescription)"
                }
            }
        }
    }
}

struct CardList_Preview: PreviewProvider {
    static var previews: some View {
        CardListView()
    }
}
