import SwiftUI
import ZettelgardenShared

struct AddCardView: View {
    @ObservedObject var cardListViewModel: PartialCardViewModel

    @State private var newCard: Card = Card.emptyCard
    @State private var cardID: String = ""
    @State private var title: String = ""
    @State private var bodyText: String = ""
    @State private var link: String = ""
    @State private var message: String = ""

    private func saveCard() {
        cardListViewModel.createNewCard(card: newCard)
        cardListViewModel.loadCards()
        self.message = "card created"
    }
    var body: some View {
        Text(message)
        Form {
            Section(header: Text("Card Details")) {
                TextField("Card ID", text: $newCard.card_id)
                TextField("Title", text: $newCard.title)
                TextEditor(text: $newCard.body)
                    .frame(height: 200)
                TextField("Link", text: $newCard.link)
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
