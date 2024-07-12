//
//  PartialCard.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import Foundation

struct PartialCard: Identifiable, Codable, Equatable {
    var id: Int
    var card_id: String
    var user_id: Int
    var title: String
    var created_at: Date?
    var updated_at: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case card_id
        case user_id
        case title
        case created_at
        case updated_at
    }
    init(from decoder: Decoder) throws {
        let container: KeyedDecodingContainer<PartialCard.CodingKeys> = try decoder.container(
            keyedBy: CodingKeys.self
        )
        id = try container.decode(Int.self, forKey: .id)
        card_id = try container.decode(String.self, forKey: .card_id)
        user_id = try container.decode(Int.self, forKey: .user_id)
        title = try container.decode(String.self, forKey: .title)
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
        title: String,
        created_at: Date,
        updated_at: Date
    ) {
        self.id = id
        self.card_id = card_id
        self.user_id = user_id
        self.title = title
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
                user_id: 1,
                title: "hello world",
                created_at: Date(),
                updated_at: Date()
            ),
            PartialCard(
                id: 1,
                card_id: "1/A",
                user_id: 1,
                title: "update",
                created_at: Date(),
                updated_at: Date()
            ),
        ]

    static var emptyPartialCard: PartialCard {
        PartialCard(
            id: -1,
            card_id: "",
            user_id: -1,
            title: "",
            created_at: Date(),
            updated_at: Date()
        )
    }
}
