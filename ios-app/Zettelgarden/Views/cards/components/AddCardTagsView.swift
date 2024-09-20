import SwiftUI
import ZettelgardenShared

struct AddCardTagsView: View {
    @EnvironmentObject var tagViewModel: TagViewModel

    var onTagSelect: (Tag) -> Void

    private func tagSelected(selectedTag: Tag) {
        onTagSelect(selectedTag)
    }

    var body: some View {
        VStack(alignment: .leading) {
            Text("Select a Tag")
                .font(.headline)
                .padding(.bottom, 10)

            if let tags = tagViewModel.tags {
                ScrollView {
                    ForEach(tags, id: \.id) { tag in
                        Button(action: {
                            tagSelected(selectedTag: tag)
                        }) {
                            Text(tag.name)
                                .padding(8)
                                .background(Color.purple.opacity(0.2))
                                .foregroundColor(.purple)
                                .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())  // Removes default button behavior
                    }
                }
                .frame(maxWidth: .infinity)
            }
            else {
                Text("No Tags Available")
                    .foregroundColor(.gray)
                    .padding()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 5).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct AddCardTagsView_Previews: PreviewProvider {
    static var mockTagViewModel: TagViewModel {
        let viewModel = TagViewModel()
        viewModel.tags = Tag.sampleData
        return viewModel
    }
    static var previews: some View {
        return AddCardTagsView(onTagSelect: { tag in })
            .previewLayout(.sizeThatFits)
            .padding()
            .environmentObject(mockTagViewModel)

    }
}
