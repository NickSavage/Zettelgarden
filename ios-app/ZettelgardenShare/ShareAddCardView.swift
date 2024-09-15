//
//  ShareAddTaskView.swift
//  ZettelgardenShare
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation
import SwiftUI
import ZettelgardenShared

struct ShareAddCardView: View {
    var extensionContext: NSExtensionContext?
    @State var data: [NSItemProvider]?
    @ObservedObject var cardListViewModel = PartialCardViewModel()

    @State private var newCard: Card = Card.emptyCard

    @State private var message: String = ""

    func handleAttachments() {

        for provider in data! {
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                if let url = url as? URL {
                    newCard.link = url.absoluteString
                }

            }
        }
    }

    private func saveCard() {
        var newCard = Card.emptyCard
        cardListViewModel.createNewCard(card: newCard)
        extensionContext!.completeRequest(returningItems: nil, completionHandler: nil)
    }

    var body: some View {
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
        .onAppear {
            handleAttachments()
        }
    }
}
