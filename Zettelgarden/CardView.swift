import SwiftUI

struct CardView: View {
    @State private var isPresentingEditView = false
    @State private var card: Card?
    @State private var isLoading = true // Changed to true to show loading indicator initially
    @AppStorage("jwt") private var token: String?
    let cardPK: Int
    
    var body: some View {
        VStack(alignment: .leading) {
            if isLoading {
                ProgressView("Loading")
            } else if let card = card {
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
            } else {
                Text("No card available")
            }
        }
        .onAppear { loadCard() }
        .sheet(isPresented: $isPresentingEditView) {
            if let card = card {
                CardEditView(card: Binding(get: { card }, set: { self.card = $0 }), onSave: { editedCard in
                    // Handle the save action for the edited card
                    self.card = editedCard
                }, isNew: false)
            } else {
                Text("Loading...")
            }
        }
    }

    private func loadCard() {
        guard let token = token else {
            print("Token is missing")
            return
        }

        fetchCard(token: token, id: cardPK) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCard):
                    self.card = fetchedCard
                    self.isLoading = false
                case .failure(let error):
                    print("Unable to load card: \(error.localizedDescription)")
                    self.isLoading = false
                }
            }
        }
    }
}

struct CardView_Previews: PreviewProvider {
    static var previews: some View {
        CardView(cardPK: 0)
    }
}
