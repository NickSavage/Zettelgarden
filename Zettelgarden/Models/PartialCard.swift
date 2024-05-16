//
//  PartialCard.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import Foundation

struct PartialCard: Identifiable, Codable {
    var id: Int
    var card_id: String
    var title: String
    var created_at: Date?
    var updated_at: Date?
}

extension PartialCard {
    static var sampleData: [PartialCard] =
    [
        PartialCard(id: 0,
            card_id: "1",
            title: "hello world",
            created_at: Date(),
            updated_at: Date()
        ),
        PartialCard(id: 1,
            card_id: "1/A",
            title: "update",
            created_at: Date(),
            updated_at: Date()
        )
    ]

    static var emptyPartialCard: PartialCard {
        PartialCard(
            id: -1,
            card_id: "",
            title: "",
            created_at: Date(),
            updated_at: Date()
        )
    }
}
