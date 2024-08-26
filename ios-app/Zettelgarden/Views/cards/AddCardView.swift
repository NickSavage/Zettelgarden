import SwiftUI
import ZettelgardenShared

struct AddCardView: View {
    @ObservedObject var cardListViewModel: PartialCardViewModel

    @State private var cardID: String = ""
    @State private var title: String = ""
    @State private var bodyText: String = ""
    @State private var message: String = ""

    private func saveCard() {
        var newCard = Card.emptyCard
        newCard.card_id = cardID
        newCard.title = title
        newCard.body = bodyText
        cardListViewModel.createNewCard(card: newCard)
        cardListViewModel.loadCards()
    }
    var body: some View {
        NavigationView {
            Text(message)
            Form {
                Section(header: Text("Card Details")) {
                    TextField("Card ID", text: $cardID)
                    TextField("Title", text: $title)
                    TextEditor(text: $bodyText)
                        .frame(height: 200)
                }
            }
            .navigationBarTitle("New Card", displayMode: .inline)
            .navigationBarItems(
                trailing: Button("Save") {
                    saveCard()
                    self.message = "card created"
                }
            )
        }
    }
}
