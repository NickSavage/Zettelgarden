import SwiftUI

struct CardEditView: View {
    @Environment(\.presentationMode) var presentationMode
    @Binding var card: Card
    var onSave: (Card) -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Card Details")) {
                    TextField("Card ID", text: $card.card_id)
                    TextField("Title", text: $card.title)
                    TextField("Body", text: $card.body)
                }
            }
            .navigationBarTitle(card.card_id.isEmpty ? "New Card" : "Edit Card", displayMode: .inline)
            .navigationBarItems(leading: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            }, trailing: Button("Save") {
                onSave(card)
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

// Update the preview to pass a binding
struct CardEditView_Previews: PreviewProvider {
    static var previews: some View {
        CardEditView(card: .constant(Card.sampleData[0])) { _ in }
    }
}
