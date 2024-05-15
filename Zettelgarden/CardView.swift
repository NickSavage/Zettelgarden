import SwiftUI

struct CardView: View {
    @State private var isPresentingEditView = false
    @State private var card: Card?
    @State private var isLoading = false
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
            }
        }
        .onAppear {loadCard()}

    }
    private func loadCard() {
        guard let token = token else {
            print("something is wrong")
            return
        }

        fetchCard(token: token, id: cardPK) { result in
                    DispatchQueue.main.async {
                        switch result {
                        case .success(let fetchedCard):
                            self.card = fetchedCard
                            self.isLoading = false
                        case .failure(let error):
                            print("unable to load card")
                            self.isLoading = false
                        }
                    }
                }
    }
}

struct CardView_Previews: PreviewProvider {
    static var card = Card.sampleData[0]
    static var previews: some View {
        CardView(cardPK: 0)
    }
}
