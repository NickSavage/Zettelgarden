import SwiftUI
import ZettelgardenShared

struct AddCardEditView: View {
    @ObservedObject var cardListViewModel: PartialCardViewModel
    @Binding var card: Card
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?
    var isNew: Bool

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Card Details")) {
                    TextField("Card ID", text: $card.card_id)
                    TextField("Title", text: $card.title)
                    TextEditor(text: $card.body)
                        .frame(height: 200)
                }
            }
            .navigationBarTitle(isNew ? "New Card" : "Edit Card", displayMode: .inline)
            .navigationBarItems(
                trailing: Button("Save") {
                    guard let token = token else {
                        print("Token is missing")
                        return
                    }
                    let session = openSession(token: token, environment: .production)
                    if isNew {
                        saveNewCard(session: session, card: card) { result in
                            switch result {
                            case .success(let savedCard):
                                print("success!")
                            case .failure(let error):
                                print("Failed to save new card: \(error)")
                            }
                        }
                    }
                    else {
                        saveExistingCard(session: session, card: card) { result in
                            switch result {
                            case .success(let savedCard):
                                print("success!")

                            case .failure(let error):
                                print("Failed to save existing card: \(error)")
                            }
                        }
                    }
                }
            )
        }
    }
}
