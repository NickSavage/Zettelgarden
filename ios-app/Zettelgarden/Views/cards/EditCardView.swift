import SwiftUI
import ZettelgardenShared

struct EditCardView: View {
    //    @ObservedObject var cardListViewModel: PartialCardViewModel
    @ObservedObject var cardViewModel: CardViewModel
    @State private var cardCopy: Card = Card.emptyCard
    @State private var showAlert = false

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
                    TextField("Link", text: $cardCopy.link)
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
            Button(action: {
                showAlert = true

            }) {
                Text("Delete")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.white)
                    .background(Color.red)
                    .cornerRadius(10)
            }
            .padding()
            .alert(isPresented: $showAlert) {
                Alert(
                    title: Text("Warning"),
                    message: Text(
                        "Are you sure you want to delete this card? This action cannot be undone."
                    ),
                    primaryButton: .destructive(Text("Delete")) {
                        cardViewModel.sendDeleteCard()
                        message = "Card Deleted"
                    },
                    secondaryButton: .cancel()
                )
            }

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
