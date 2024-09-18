import SwiftUI
import ZettelgardenShared

struct AddCardView: View {
    @ObservedObject var cardListViewModel: PartialCardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel

    @State private var isBacklinkInputPresented = false

    @State private var newCard: Card = Card.emptyCard
    @State private var message: String = ""

    private func saveCard() {
        cardListViewModel.createNewCard(card: newCard)
        cardListViewModel.loadCards()
        self.message = "card created"
    }

    private func addBacklink(card: PartialCard) {

    }
    var body: some View {
        VStack {
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
                isBacklinkInputPresented.toggle()
            }) {
                Text("Add Backlink")
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
        .sheet(isPresented: $isBacklinkInputPresented) {
            BacklinkInputView(
                card: $newCard,
                viewModel: cardListViewModel,
                navigationViewModel: navigationViewModel,
                onCardSelect: { selectedCard in
                    newCard.body = newCard.body + "\n\n[\(selectedCard.card_id)]"
                }
            )
            .presentationDetents([.medium, .large])
        }
    }
}

struct AddCardView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = PartialCardViewModel()
        let mockNavigationViewModel = getTestNavigationViewModel()

        return AddCardView(
            cardListViewModel: mockViewModel,
            navigationViewModel: mockNavigationViewModel
        )
        .previewLayout(.sizeThatFits)
        .padding()
    }

}
