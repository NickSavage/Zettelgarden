import SwiftUI
import ZettelgardenShared

struct AddRecordingView: View {
    @ObservedObject var cardListViewModel: PartialCardViewModel

    @State private var cardID: String = ""
    @State private var title: String = {
        // Generate formatted date string
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"  // Set the desired date format
        let dateString = formatter.string(from: Date())

        // Return the prefilled title
        return "Recording - \(dateString)"
    }()
    @State private var message: String = ""
    @State private var transcriptText: String = ""

    @StateObject private var speechRecognizer = SpeechRecognizer()

    private func saveCard() {
        var newCard = Card.emptyCard
        newCard.card_id = cardID
        newCard.title = title
        newCard.body = transcriptText
        cardListViewModel.createNewCard(card: newCard)
        cardListViewModel.loadCards()
        self.message = "card created"
    }

    var body: some View {
        Text(message)
        Form {
            TextField("Card ID", text: $cardID)
            TextField("Title", text: $title)
            TextEditor(text: $transcriptText)  // Bind to the state variable here
                .onChange(of: speechRecognizer.transcript) { newValue in
                    if !speechRecognizer.isTranscribing {
                        return
                    }
                    transcriptText = speechRecognizer.completeTranscript + newValue
                }

        }
        VStack {
            if speechRecognizer.isTranscribing {
                Button(action: {
                    speechRecognizer.stopTranscribing()
                }) {
                    Text("Stop Recording")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()

            }
            else {
                Button(action: {
                    speechRecognizer.resetTranscript()
                    speechRecognizer.startTranscribing()
                }) {
                    Text("Start Recording")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()

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

    }
}
struct AddRecordingView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = PartialCardViewModel()

        // Return a preview of the CardListItem with the mock data
        return AddRecordingView(cardListViewModel: mockViewModel)
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
