import SwiftUI

struct CardDisplayView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @State private var isPresentingEditView = false

    var body: some View {
        VStack(alignment: .leading) {

            if let card = cardViewModel.card {
                HStack {
                    Text(card.card_id).foregroundColor(.blue)
                    Text(" - ")
                    Text(card.title)
                    Spacer()
                    Button(action: {
                        isPresentingEditView = true
                    }) {
                        Image(systemName: "pencil")
                    }
                }
                .bold()
                .padding()
                TabView {

                    VStack(alignment: .leading) {
                        Text(card.body).padding()
                        Spacer()
                        VStack {
                            if let parentCard = card.parent {
                                Text("Parent").bold()
                                CardListItem(card: parentCard, cardViewModel: cardViewModel)
                            }
                        }.padding()

                        VStack(alignment: .leading) {
                            Text("Created at: \(card.created_at, style: .date)")
                            Text("Updated at: \(card.updated_at, style: .date)")
                        }
                        .padding()
                    }
                    VStack {

                        VStack {
                            Text("References").bold()
                            List(card.references.reversed()) { childCard in
                                CardListItem(card: childCard, cardViewModel: cardViewModel)
                            }
                            Text("Children").bold()
                            List(card.children.reversed()) { childCard in
                                CardListItem(card: childCard, cardViewModel: cardViewModel)
                            }
                        }

                    }
                    VStack {
                        Text("Files").bold()
                        List(card.files) { file in
                            FileCardListItem(file: file)
                        }
                    }
                }
                .tabViewStyle(PageTabViewStyle())
                HStack {
                    Button(action: {
                        cardViewModel.previousCard()
                    }) {
                        Image(systemName: "chevron.backward")
                        .resizable()
                        .frame(width: 20, height: 20)
                        .padding()
                    }
                    .buttonStyle(BorderlessButtonStyle())
                    Button(action: {
                        cardViewModel.nextCard()
                    }) {
                        Image(systemName: "chevron.forward")
                        .resizable()
                        .frame(width: 20, height: 20)
                        .padding()
                    }
                    .buttonStyle(BorderlessButtonStyle())
                    Spacer()
                    QuickAddMenu()
                    Spacer()
                }
                .padding()
            }
            else {
                Text("No card available")
            }
        }
        .sheet(isPresented: $isPresentingEditView) {
            if let card = cardViewModel.card {
                CardEditView(
                    card: Binding(get: { card }, set: { self.cardViewModel.card = $0 }),
                    onSave: { editedCard in
                        // Handle the save action for the edited card
                        self.cardViewModel.card = editedCard
                    },
                    isNew: false
                )
            }
            else {
                Text("Loading...")
            }
        }
    }
}

struct CardView_Previews: PreviewProvider {
    static var previews: some View {
        let mockCard = Card.sampleData[0]

        let cardViewModel = CardViewModel()
        cardViewModel.card = mockCard

        return CardDisplayView(cardViewModel: cardViewModel)
    }
}
