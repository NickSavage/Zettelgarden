import SwiftUI
import ZettelgardenShared

struct CardEditView: View {
    @Environment(\.presentationMode) var presentationMode
    @Binding var card: Card
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?
    var onSave: (Card) -> Void
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
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Save") {
                    guard let token = token else {
                        print("Token is missing")
                        return
                    }
                    if isNew {
                        saveNewCard(token: token, card: card) { result in
                            switch result {
                            case .success(let savedCard):
                                print("success!")
                                onSave(savedCard)
                            case .failure(let error):
                                print("Failed to save new card: \(error)")
                            }
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                    else {
                        saveExistingCard(token: token, card: card) { result in
                            switch result {
                            case .success(let savedCard):
                                print("success!")

                                onSave(savedCard)
                            case .failure(let error):
                                print("Failed to save existing card: \(error)")
                            }
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                }
            )
        }
    }
}
