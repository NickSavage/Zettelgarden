import SwiftUI
import ZettelgardenShared

struct AddCardView: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel

    @State private var isBacklinkInputPresented = false

    @State private var newCard: Card = Card.emptyCard
    @State private var message: String = ""

    init(card_id: String? = nil) {
        var initialNewCard = Card.emptyCard

        if let card_id = card_id {
            initialNewCard.card_id = card_id
        }

        _newCard = State(initialValue: initialNewCard)
    }

    var body: some View {
        VStack {

            let onSave: (_ card: Card) -> Void = { card in
                partialCardViewModel.loadCards()
            }

            CreateCardView(message: $message, newCard: $newCard, onSave: onSave)
        }
    }
}

struct AddCardView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = PartialCardViewModel()

        return AddCardView()
            .environmentObject(mockViewModel)
            .previewLayout(.sizeThatFits)
            .padding()
    }

}
