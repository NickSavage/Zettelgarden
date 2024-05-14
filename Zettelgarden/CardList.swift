import SwiftUI

struct CardList: View {
    @State private var cards: [Card] = Card.sampleData
    @State private var isPresentingNewCardView = false
    @State private var newCard = Card.emptyCard
    
    var body: some View {
        NavigationStack {
            List(cards) { card in
                NavigationLink(destination: CardView(card: card)) {
                    CardListItem(card: card)
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
        CardList()
    }
}
