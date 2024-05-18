import SwiftUI

struct CardDisplayView: View {
    @State private var isPresentingEditView = false
    @ObservedObject var viewModel = CardViewModel()
    let cardPK: Int
    
    var body: some View {
        VStack(alignment: .leading) {
            if viewModel.isLoading {
                ProgressView("Loading")
            } else if let card = viewModel.card {
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
                TabView() {
                    
                    VStack {
                        Text(card.body)
                        Spacer()
                        if let parentCard = card.parent {
                            Text("Parent")
                            NavigationLink(destination: CardDisplayView(cardPK: parentCard.id)) {
                                CardListItem(card: parentCard)
                            }
                        }
                        
                        VStack(alignment: .leading) {
                            Text("Created at: \(card.created_at, style: .date)")
                            Text("Updated at: \(card.updated_at, style: .date)")
                        }
                        .padding()
                    }
                    VStack {
                        
                        VStack {
                            Text("References").bold()
                            List(card.references) { childCard in
                                NavigationLink(destination: CardDisplayView(cardPK: childCard.id)) {
                                    CardListItem(card: childCard)
                                }
                            }
                            Text("Children").bold()
                            List(card.children) { childCard in
                                NavigationLink(destination: CardDisplayView(cardPK: childCard.id)) {
                                    CardListItem(card: childCard)
                                }
                            }
                        }
                        
                    }
                }
                .tabViewStyle(PageTabViewStyle())
            } else {
                Text("No card available")
            }
        }
        .onAppear { viewModel.loadCard(cardPK: cardPK) }
        .sheet(isPresented: $isPresentingEditView) {
            if let card = viewModel.card {
                CardEditView(card: Binding(get: { card }, set: { self.viewModel.card = $0 }), onSave: { editedCard in
                    // Handle the save action for the edited card
                    self.viewModel.card = editedCard
                }, isNew: false)
            } else {
                Text("Loading...")
            }
        }
    }
}

struct CardView_Previews: PreviewProvider {
    static var previews: some View {
        let mockCard = Card.sampleData[0]
        
        let viewModel = CardViewModel()
        viewModel.card = mockCard
        viewModel.isLoading = false
        
        return CardDisplayView(viewModel: viewModel, cardPK: 0)
    }
}
