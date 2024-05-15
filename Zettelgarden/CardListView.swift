import SwiftUI

struct CardListView: View {
    @State private var cards: [Card] = []
    @State private var isPresentingNewCardView = false
    @State private var newCard = Card.emptyCard
    
    var body: some View {
        NavigationStack {
            Text("Zettelgarden")
            Picker(selection: /*@START_MENU_TOKEN@*/.constant(1)/*@END_MENU_TOKEN@*/, label: /*@START_MENU_TOKEN@*/Text("Picker")/*@END_MENU_TOKEN@*/) {
                Text("All Cards").tag(1)
                Text("Recent Cards").tag(2)
            }
            List(cards) { card in
                NavigationLink(destination: CardView(card: card)) {
                    CardListItem(card: card)
                }
            }.onAppear {
                fetchCards(searchTerm: "mafia") { result in
                    switch result {
                    case .success(let fetchedCards):
                        DispatchQueue.main.async {
                            self.cards = fetchedCards
                        }
                    case .failure(let error):
                        print("Error fetching cards: \(error)")
                    }
                }
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
            CardEditView(card: $newCard) { newCard in
                // Handle the save action for the new card
                cards.append(newCard)
            }
        }
    }
}

struct CardList_Preview: PreviewProvider {
    static var previews: some View {
        CardListView()
    }
}
