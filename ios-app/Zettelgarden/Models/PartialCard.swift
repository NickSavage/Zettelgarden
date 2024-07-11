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
    enum CodingKeys: String, CodingKey {
        case id
        case card_id
        case title
        case created_at
        case updated_at
    }
    init(from decoder: Decoder) throws {
        let container: KeyedDecodingContainer<PartialCard.CodingKeys> = try decoder.container(
            keyedBy: CodingKeys.self
        )
        id = try container.decode(Int.self, forKey: .id)
        card_id = try container.decode(String.self, forKey: .card_pk)
        user_id = try container.decode(Int.self, forKey: .user_id)
        created_at = try container.decode(Date.self, forKey: .created_at)
        updated_at = try container.decode(Date.self, forKey: .updated_at)
        let createdAtString = try container.decodeIfPresent(
            String.self,
            forKey: .created_at
        )
        created_at = parseDate(input: createdAtString)
        let updatedAtString = try container.decodeIfPresent(
            String.self,
            forKey: .updated_at
        )
        updated_at = parseDate(input: updatedAtString)
    }

    init(
        id: Int,
        card_id: String,
        user_id: Int,
        created_at: Date,
        updated_at: Date
    ) {
        self.id = id
        self.card_id = card_id
        self.user_id = user_id
        self.created_at = created_at
        self.updated_at = updated_at
    }
}

extension PartialCard {
    static var sampleData: [PartialCard] =
        [
            PartialCard(
                id: 0,
                card_id: "1",
                title: "hello world",
                created_at: Date(),
                updated_at: Date()
            ),
            PartialCard(
                id: 1,
                card_id: "1/A",
                title: "update",
                created_at: Date(),
                updated_at: Date()
            ),
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
