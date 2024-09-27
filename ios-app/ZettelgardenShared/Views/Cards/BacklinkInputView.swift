import SwiftUI
import ZettelgardenShared

public struct BacklinkInputView: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var navigationViewModel: NavigationViewModel
    @State private var searchText: String = ""
    var onCardSelect: (PartialCard) -> Void

    public init(onCardSelect: @escaping (PartialCard) -> Void) {
        self.onCardSelect = onCardSelect
    }
    var filteredCards: [PartialCard] {
        guard let cards = partialCardViewModel.cards else {
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
    public var body: some View {
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
    static var previews: some View {
        let partialCardViewModel = getTestPartialCardViewModel()
        let navigationViewModel = getTestNavigationViewModel()
        return BacklinkInputView(
            onCardSelect: { selectedCard in
                // Example logic for demonstration
            }
        ).previewLayout(.sizeThatFits)
            .padding()
            .environmentObject(partialCardViewModel)
            .environmentObject(navigationViewModel)
    }

}
