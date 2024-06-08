//
//  Card.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//
import Combine
import Foundation
import SwiftUI

struct Card: Identifiable, Codable {
    var id: Int
    var card_id: String
    var user_id: Int
    var title: String
    var body: String
    var link: String?
    var created_at: Date
    var updated_at: Date
    var parent: PartialCard?
    //var card_links: [PartialCard]
    var children: [PartialCard]
    var references: [PartialCard]
    var backlinks: [PartialCard]
    var files: [File]
}

extension Card {
    static var sampleData: [Card] =
    [
        Card(id: 0,
            card_id: "1",
            user_id: 1,
            title: "hello world",
            body: "this is a test of the emergency response system",
            link: "",
            created_at: Date(),
            updated_at: Date(),
             children: [],
             references: [],
             backlinks: [],
             files: []
        ),
        Card(id: 1,
            card_id: "1/A",
            user_id: 1,
            title: "update",
            body: "this is another test of the emergency response system",
            link: "",
            created_at: Date(),
            updated_at: Date(),
             children: [],
             references: [],
             backlinks: [],
             files:[]
        ),
    ]

    static var emptyCard: Card {
        Card(
            id: -1,
            card_id: "",
            user_id: -1,
            title: "",
            body: "",
            link: "",
            created_at: Date(),
            updated_at: Date(),
            children: [],
            references:[],
            backlinks:[],
            files:[]
        )
    }
}
