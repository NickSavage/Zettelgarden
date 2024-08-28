import SwiftUI
import ZettelgardenShared

struct EditCardView: View {
    //    @ObservedObject var cardListViewModel: PartialCardViewModel
    @ObservedObject var cardViewModel: CardViewModel
    @State private var cardCopy: Card = Card.emptyCard

    @State private var message: String = ""

    var body: some View {

        Text(message)
        if let card = cardViewModel.card {
            Form {
                Section(header: Text("Card Details")) {
                    TextField("Card ID", text: $cardCopy.card_id)
                    TextField("Title", text: $cardCopy.title)
                    TextEditor(text: $cardCopy.body)
                        .frame(height: 200)
                }
            }
            Button(action: {
                cardViewModel.card = cardCopy
                cardViewModel.saveCard()
                message = "Card Updated"

            }) {
                Text("Save")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.white)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding()
            .onAppear {
                cardCopy = card
            }

        }
    }

}

struct EditCardView_Previews: PreviewProvider {
    static var previews: some View {
        //     let mockViewModel = PartialCardViewModel()
        let mockCard = CardViewModel()
        mockCard.loadTestCard(card: Card.sampleData[0])

        // Return a preview of the CardListItem with the mock data
        //return EditCardView(cardListViewModel: mockViewModel, cardViewModel: mockCard)
        return EditCardView(cardViewModel: mockCard)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
