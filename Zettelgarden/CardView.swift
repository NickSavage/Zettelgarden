//
//  CardView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct CardView: View {
    let card: Card
    var body: some View {
        VStack(alignment: .leading){
            HStack {
                Text(card.card_id).foregroundColor(.blue)
                Text(" - ")
                Text(card.title)
                Spacer()
            }.bold().padding()
            VStack {
                Text(card.body).padding()
            }
            Spacer()
            VStack (alignment: .leading) {
                Text("Created at: \(card.created_at, style: .date)")
                Text("Updated at: \(card.updated_at, style: .date)")
            }.padding()
        }
    }
}
struct CardView_Previews: PreviewProvider {
    static var card = Card.sampleData[0]
    static var previews: some View {
        CardView(card: card)
    }
}
