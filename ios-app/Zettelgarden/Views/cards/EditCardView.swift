import SwiftUI
import ZettelgardenShared

struct EditCardView: View {
    @EnvironmentObject var cardListViewModel: PartialCardViewModel
    @EnvironmentObject var cardViewModel: CardViewModel
    @EnvironmentObject var navigationViewModel: NavigationViewModel

    @EnvironmentObject var tagViewModel: TagViewModel
    @State private var cardCopy: Card = Card.emptyCard
    @State private var showDeleteAlert = false
    @State private var isBacklinkInputPresented = false
    @State private var showAddTagsSheet = false

    @State private var message: String = ""

    var body: some View {

        Text(message)
        if let card = cardViewModel.card {
            VStack {
                HStack {
                    Spacer()
                    Menu {

                        Button(action: {
                            isBacklinkInputPresented.toggle()
                        }) {
                            Text("Add Backlink")
                        }
                        Button(action: {
                            showAddTagsSheet.toggle()
                        }) {
                            Text("Add Tags")
                        }
                        Button(action: {
                            showDeleteAlert = true
                        }) {
                            Text("Delete Card")
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.circle")
                            .font(.largeTitle)  // Optional: Adjust the size as needed
                    }
                    .alert(isPresented: $showDeleteAlert) {
                        Alert(
                            title: Text("Warning"),
                            message: Text(
                                "Are you sure you want to delete this card? This action cannot be undone."
                            ),
                            primaryButton: .destructive(Text("Delete")) {
                                cardViewModel.sendDeleteCard()
                                message = "Card Deleted"
                            },
                            secondaryButton: .cancel()
                        )
                    }
                }
                Form {
                    Section(header: Text("Card Details")) {
                        TextField("Card ID", text: $cardCopy.card_id)
                        TextField("Title", text: $cardCopy.title)
                        TextEditor(text: $cardCopy.body)
                            .frame(height: 200)
                        TextField("Link", text: $cardCopy.link)
                    }
                }
                Button(action: {
                    cardViewModel.card = cardCopy
                    cardViewModel.saveCard()
                    message = "Card Updated"

                }) {
                    Text("Save")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding()

                .onAppear {
                    cardCopy = card
                }
            }
            .sheet(isPresented: $isBacklinkInputPresented) {
                BacklinkInputView(
                    card: $cardCopy,
                    viewModel: cardListViewModel,
                    navigationViewModel: navigationViewModel,
                    onCardSelect: { selectedCard in
                        cardCopy.body = cardCopy.body + "\n\n[\(selectedCard.card_id)]"
                    }
                )
                .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $showAddTagsSheet) {
                VStack {
                    if let tags = tagViewModel.tags {  // Unwrap optional tags safely
                        ForEach(tags, id: \.id) { tag in  // Use tag.id since Tag already conforms to Identifiable
                            Button(action: {
                                cardCopy.body = cardCopy.body + "\n\n#" + tag.name
                                showAddTagsSheet = false
                            }) {
                                Text(tag.name)
                            }
                            .padding(.vertical, 2)  // Add some vertical padding between buttons
                        }
                    }
                    else {
                        Text("No Tags Available")  // Default view when tags are nil
                            .padding()
                    }
                }

            }

        }
    }

}

struct EditCardView_Previews: PreviewProvider {
    static var previews: some View {
        //     let mockViewModel = PartialCardViewModel()
        let mockCard = CardViewModel()
        mockCard.loadTestCard(card: Card.sampleData[0])
        let mockNavigationViewModel = getTestNavigationViewModel()
        let mockViewModel = PartialCardViewModel()

        // Return a preview of the CardListItem with the mock data
        //return EditCardView(cardListViewModel: mockViewModel, cardViewModel: mockCard)
        return EditCardView()
            .previewLayout(.sizeThatFits)
            .padding()  // Add some padding for better appearance in the preview
    }

}
