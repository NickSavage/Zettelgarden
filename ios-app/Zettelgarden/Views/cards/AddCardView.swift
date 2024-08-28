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
        self.message = "card created"
    }
    var body: some View {
        Text(message)
        Form {
            Section(header: Text("Card Details")) {
                TextField("Card ID", text: $cardID)
                TextField("Title", text: $title)
                TextEditor(text: $bodyText)
                    .frame(height: 200)
            }
        }
        Button(action: {
            saveCard()
        }) {
            Text("Save")
                .frame(maxWidth: .infinity)
                .padding()
                .foregroundColor(.white)
                .background(Color.blue)
                .cornerRadius(10)
        }
        .padding()
    }
}

struct AddCardView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = PartialCardViewModel()

        // Return a preview of the CardListItem with the mock data
        return AddCardView(cardListViewModel: mockViewModel)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
