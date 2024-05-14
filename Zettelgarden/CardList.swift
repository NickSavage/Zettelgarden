//
//  CardList.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct CardList: View {
    let cards: [Card]
    var body: some View {
        NavigationStack {
            List(cards) { card in
                NavigationLink(destination: Text("test")) {
                    CardListItem(card: card)
                }
            }
        }
    }
    
}

struct ScrumsView_Previews: PreviewProvider {
    static var previews: some View {
        CardList(cards: Card.sampleData)
    }
}
