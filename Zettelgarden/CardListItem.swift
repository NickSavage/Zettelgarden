//
//  CardListItem.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct CardListItem: View {
    let card: PartialCard
    var body: some View {
        VStack {
            HStack {
                Text(card.card_id).foregroundColor(.blue)
                Text(" - ")
                Text(card.title).foregroundColor(.black)
                Spacer()
            }.bold()
        }
    }
    func truncate(_ string: String, to length: Int) -> String {
        if string.count > length {
            let endIndex = string.index(string.startIndex, offsetBy: length)
            return String(string[..<endIndex]) + "..."
        } else {
            return string
        }
    }

}

struct CardListItem_Previews: PreviewProvider {
    static var card = PartialCard.sampleData[0]
    static var previews: some View {
        CardListItem(card: card).previewLayout(.fixed(width: 400, height: 40))
    }
}
