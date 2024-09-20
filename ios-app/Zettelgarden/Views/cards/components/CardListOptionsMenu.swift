import SwiftUI
import ZettelgardenShared

struct CardListOptionsMenu: View {
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel
    @EnvironmentObject var tagViewModel: TagViewModel

    var body: some View {
        Menu {
            if let tags = tagViewModel.tags {
                Menu("Filter By Tag") {
                    ForEach(tags, id: \.id) { tag in

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
