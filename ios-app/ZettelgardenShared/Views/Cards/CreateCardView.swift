//
//  CreateCardView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-09-27.
//

import Foundation
import SwiftUI

public struct CreateCardView: View {
    @Binding var message: String
    @Binding var newCard: Card
    @EnvironmentObject var partialCardViewModel: PartialCardViewModel

    @State private var isBacklinkInputPresented = false

    var onSave: (_ card: Card) -> Void

    public init(
        message: Binding<String>,
        newCard: Binding<Card>,
        onSave: @escaping (_ card: Card) -> Void
    ) {
        self._message = message
        self._newCard = newCard
        self.onSave = onSave
    }
    private func saveCard() {
        partialCardViewModel.createNewCard(card: newCard) { result in
            message = result
            print(result)
        }
        onSave(newCard)
    }

    public var body: some View {
        VStack {
            Text(message)
            Form {
                Section(header: Text("Card Details")) {
                    TextField("Card ID", text: $newCard.card_id)
                    TextField("Title", text: $newCard.title)
                    TextEditor(text: $newCard.body)
                        .frame(height: 200)
                    TextField("Link", text: $newCard.link)
                }
            }
            Spacer()
            Button(action: {
                isBacklinkInputPresented.toggle()
            }) {
                Text("Add Backlink")
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
        .sheet(isPresented: $isBacklinkInputPresented) {
            BacklinkInputView(
                onCardSelect: { selectedCard in
                    newCard.body = newCard.body + "\n\n[\(selectedCard.card_id)]"
                    isBacklinkInputPresented = false
                }
            )
            .presentationDetents([.medium, .large])
        }

    }
}
