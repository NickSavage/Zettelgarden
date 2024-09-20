//
//  PartialCard.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation

public struct PartialCard: Identifiable, Codable {
    public var id: Int
    public var card_id: String
    public var user_id: Int
    public var title: String
    public var created_at: Date
    public var updated_at: Date
    public var tags: [Tag]

    enum CodingKeys: String, CodingKey {
        case id
        case card_id
        case user_id
        case title
        case created_at
        case updated_at
        case tags
    }
    public init(from decoder: Decoder) throws {
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
        created_at = parseDate(input: createdAtString) ?? Date()
        let updatedAtString = try container.decodeIfPresent(
            String.self,
            forKey: .updated_at
        )
        updated_at = parseDate(input: updatedAtString) ?? Date()
        tags = try container.decodeIfPresent([Tag].self, forKey: .tags) ?? []
    }

    public init(
        id: Int,
        card_id: String,
        user_id: Int,
        title: String,
        created_at: Date,
        updated_at: Date,
        tags: [Tag]
    ) {
        self.id = id
        self.card_id = card_id
        self.user_id = user_id
        self.title = title
        self.created_at = created_at
        self.updated_at = updated_at
        self.tags = tags
    }
}

extension PartialCard {
    public static var sampleData: [PartialCard] = [
        PartialCard(
            id: 0,
            card_id: "1",
            user_id: 1,
            title: "hello world",
            created_at: Date(),
            updated_at: Date(),
            tags: []
        ),
        PartialCard(
            id: 1,
            card_id: "1/A",
            user_id: 1,
            title: "update",
            created_at: Date(),
            updated_at: Date(),
            tags: []
        ),
    ]
}
