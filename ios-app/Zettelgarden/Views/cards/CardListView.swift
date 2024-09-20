import SwiftUI
import ZettelgardenShared

struct CardListView: View {
    @State private var errorMessage: String?
    @State private var isInitialized: Bool = false
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel

    var body: some View {
        VStack {
            FilterFieldView(filterText: $partialCardViewModel.filterText, placeholder: "Filter")
            if partialCardViewModel.isLoading {
                ProgressView("Loading")
            }
            else if let _ = partialCardViewModel.cards {

                List {
                    ForEach(partialCardViewModel.filteredCards ?? [], id: \.id) { card in
                        CardListItem(
                            card: card
                        )
                    }
                }
                .refreshable {
                    partialCardViewModel.loadCards()
                }
            }
        }
        .toolbar { CardListOptionsMenu() }
    }
}
