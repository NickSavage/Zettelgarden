import SwiftUI
import ZettelgardenShared

struct DisplayTaskView: View {
    @ObservedObject var taskViewModel: TaskViewModel
    @Binding var isPresented: Bool

    func handleTagTapped(tag: String) {
        print(tag)
    }
    var body: some View {
        if let task = taskViewModel.task {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Text(task.title).bold()
                        .frame(maxWidth: .infinity, alignment: .leading)  // Allow Text to take all available width before wrapping.

                }
                HStack {
                    ForEach(taskViewModel.tags, id: \.self) { tag in
                        Button(action: {
                            handleTagTapped(tag: tag)
                        }) {
                            Text(tag)
                                .padding(8)
                                .background(Color.purple.opacity(0.2))
                                .foregroundColor(.purple)
                                .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                VStack(alignment: .leading) {
                    Text("Links")
                        .font(.subheadline)  // Making the text smaller
                        .foregroundColor(.gray)
                    displayTitleLinks(title: task.title)

                }
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)  // Make the container fill all available space

        }
    }
    // Function to process title and display URLs as clickable links
    @ViewBuilder
    func displayTitleLinks(title: String) -> some View {
        let words = title.split(separator: " ").map(String.init)

        VStack {
            // Iterate through each word
            ForEach(words, id: \.self) { word in
                if let url = URL(string: word), UIApplication.shared.canOpenURL(url) {
                    Link(word, destination: url)
                        .foregroundColor(.blue)
                        .underline()
                }
                else {
                }
            }
        }
    }
}

struct DisplayTaskView_Preview: PreviewProvider {

    @State static var isPresented = true
    static var mockViewModel: TaskViewModel = getTestTaskViewModel()
    static var previews: some View {
        DisplayTaskView(
            taskViewModel: mockViewModel,
            isPresented: $isPresented
        )
        .previewLayout(.sizeThatFits)
        .padding()  // Optional: improve appearance in the preview
    }
}
