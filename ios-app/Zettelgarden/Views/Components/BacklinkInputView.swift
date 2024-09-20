import SwiftUI
import ZettelgardenShared

struct BacklinkInputView: View {
    @Binding var card: Card
    @ObservedObject var viewModel: PartialCardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
    @State private var searchText: String = ""
    var onCardSelect: (PartialCard) -> Void

    var filteredCards: [PartialCard] {
        guard let cards = viewModel.cards else {
            return []  // Return an empty array if `cards` is nil
        }

        if searchText.isEmpty {
            return cards
        }
        else {
            return cards.filter { card in
                card.title.lowercased().contains(searchText.lowercased())
            }
        }
    }

    private func cardSelected(selectedCard: PartialCard) {
        onCardSelect(selectedCard)

    }
    var body: some View {
        VStack {
            TextField("Search cards", text: $searchText)
                .padding()
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)

            List(filteredCards) { card in  // Assuming Card conforms to Identifiable
                CardListItem(card: card).onTapGesture {
                    cardSelected(selectedCard: card)
                }
            }
        }
        .padding()
    }

}

struct BacklinkInputView_Previews: PreviewProvider {
    @State static var card = Card.emptyCard
    static var previews: some View {
        let mockCardViewModel = getTestCardViewModel()
        let mockPartialCardViewModel = getTestPartialCardViewModel()
        let mockNavigationViewModel = getTestNavigationViewModel()
        return BacklinkInputView(
            card: $card,
            viewModel: mockPartialCardViewModel,
            navigationViewModel: mockNavigationViewModel,
            onCardSelect: { selectedCard in
                // Example logic for demonstration
            }
        ).previewLayout(.sizeThatFits).padding()
    }
}
