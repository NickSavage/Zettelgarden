import SwiftUI

struct CardView: View {
    @State private var isPresentingEditView = false
    @State private var card: Card
    
    init(card: Card) {
        _card = State(initialValue: card)
    }
    
    var body: some View {
        VStack(alignment: .leading) {
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
            
            VStack {
                Text(card.body).padding()
            }
            Spacer()
            VStack(alignment: .leading) {
                Text("Created at: \(card.created_at, style: .date)")
                Text("Updated at: \(card.updated_at, style: .date)")
            }
            .padding()
        }
        .sheet(isPresented: $isPresentingEditView) {
            CardEditView(card: $card) { editedCard in
                // Handle the save action for the edited card
                self.card = editedCard
            }
        }
    }
}

struct CardView_Previews: PreviewProvider {
    static var card = Card.sampleData[0]
    static var previews: some View {
        CardView(card: card)
    }
}
