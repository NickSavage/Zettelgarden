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
    @StateObject var partialCardViewModel = PartialCardViewModel()
    @StateObject var navigationViewModel: NavigationViewModel
    @StateObject var cardViewModel = CardViewModel()

    @State private var newCard: Card = Card.emptyCard

    @State private var message: String = ""

    init(extensionContext: NSExtensionContext?, data: [NSItemProvider]?) {
        self.extensionContext = extensionContext
        self.data = data
        let cardViewModel = CardViewModel()
        _navigationViewModel = StateObject(
            wrappedValue: NavigationViewModel(cardViewModel: cardViewModel)
        )
    }

    func handleAttachments() {

        for provider in data! {
            provider.loadItem(forTypeIdentifier: "public.url") { url, _ in
                if let url = url as? URL {
                    newCard.link = url.absoluteString
                }

            }
            // Check for Plain Text type
            provider.loadItem(forTypeIdentifier: "public.plain-text", options: nil) {
                (text, error) in
                if let text = text as? String {
                    DispatchQueue.main.async {
                        newCard.body = text
                    }
                }
            }
        }
    }
    var body: some View {
        VStack {

            let onSave: (_ card: Card) -> Void = { card in
                extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
            }
            CreateCardView(message: $message, newCard: $newCard, onSave: onSave)
                .environmentObject(partialCardViewModel)
                .environmentObject(navigationViewModel)
                .onAppear {
                    handleAttachments()
                }
        }
    }
}
