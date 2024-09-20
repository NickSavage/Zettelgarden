import SwiftUI
import ZettelgardenShared

struct AddCardTagsView: View {
    @EnvironmentObject var tagViewModel: TagViewModel

    var onTagSelect: (Tag) -> Void

    private func tagSelected(selectedTag: Tag) {
        onTagSelect(selectedTag)
    }

    var body: some View {
        VStack {
            if let tags = tagViewModel.tags {
                ForEach(tags, id: \.id) { tag in
                    Button(action: {
                        tagSelected(selectedTag: tag)
                    }) {
                        Text(tag.name)
                    }
                    .padding(.vertical, 2)
                }
            }
            else {
                Text("No Tags Available")
                    .padding()
            }
        }
    }
}
