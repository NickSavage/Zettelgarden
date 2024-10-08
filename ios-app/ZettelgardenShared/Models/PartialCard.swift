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
    public var parent_id: Int
    public var created_at: Date
    public var updated_at: Date
    public var tags: [Tag]
    public var is_flashcard: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case card_id
        case user_id
        case title
        case parent_id
        case created_at
        case updated_at
        case tags
        case is_flashcard
    }
    public init(from decoder: Decoder) throws {
        let container: KeyedDecodingContainer<PartialCard.CodingKeys> = try decoder.container(
            keyedBy: CodingKeys.self
        )
        id = try container.decode(Int.self, forKey: .id)
        card_id = try container.decode(String.self, forKey: .card_id)
        user_id = try container.decode(Int.self, forKey: .user_id)
        title = try container.decode(String.self, forKey: .title)
        parent_id = try container.decode(Int.self, forKey: .parent_id)
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

        is_flashcard = try container.decodeIfPresent(Bool.self, forKey: .is_flashcard) ?? false
    }

    public init(
        id: Int,
        card_id: String,
        user_id: Int,
        title: String,
        parent_id: Int,
        created_at: Date,
        updated_at: Date,
        tags: [Tag],
        is_flashcard: Bool
    ) {
        self.id = id
        self.card_id = card_id
        self.user_id = user_id
        self.title = title
        self.parent_id = parent_id
        self.created_at = created_at
        self.updated_at = updated_at
        self.tags = tags
        self.is_flashcard = is_flashcard
    }
}

extension PartialCard {
    public static var sampleData: [PartialCard] = [
        PartialCard(
            id: 0,
            card_id: "1",
            user_id: 1,
            title: "hello world",
            parent_id: 0,
            created_at: Date(),
            updated_at: Date(),
            tags: [],
            is_flashcard: false
        ),
        PartialCard(
            id: 1,
            card_id: "1/A",
            user_id: 1,
            title: "update",
            parent_id: 1,
            created_at: Date(),
            updated_at: Date(),
            tags: [],
            is_flashcard: false
        ),
    ]
}
