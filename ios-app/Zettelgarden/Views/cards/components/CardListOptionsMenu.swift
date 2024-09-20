import SwiftUI
import ZettelgardenShared

struct CardListOptionsMenu: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var tagViewModel: TagViewModel

    var body: some View {
        Menu {
            if let tags = tagViewModel.tags {
                let filteredTags = tags.filter { $0.card_count > 0 }
                    .sorted(by: { $0.name < $1.name })
                Menu("Filter By Tag") {
                    ForEach(filteredTags, id: \.id) { tag in

                        Button(action: {
                            partialCardViewModel.filterText = "#" + tag.name

                        }) {
                            Text(tag.name)
                        }
                    }
                }
            }
            if partialCardViewModel.filterText != "" {
                Button(
                    "Remove Filter",
                    action: { partialCardViewModel.filterText = "" }
                )
            }
            Button(
                partialCardViewModel.displayOnlyTopLevel
                    ? "Show All Cards" : "Show Top Level Cards",
                action: { partialCardViewModel.displayOnlyTopLevel.toggle() }
            )

        } label: {
            Image(systemName: "gearshape")
                .padding()
        }

    }
}

struct CardListOptionsMenu_Preview: PreviewProvider {
    static var mockViewModel: PartialCardViewModel = getTestPartialCardViewModel()
    static var mockTagViewModel: TagViewModel = getTestTagViewModel()

    static var previews: some View {
        CardListOptionsMenu()
            .previewLayout(.sizeThatFits)
            .padding()
            .environmentObject(mockViewModel)
            .environmentObject(mockTagViewModel)
    }
}
