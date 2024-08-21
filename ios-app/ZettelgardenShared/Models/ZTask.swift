//
//  ZTask.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation

public struct ZTask: Identifiable, Decodable, Encodable, Equatable {
    public var id: Int
    public var card_pk: Int
    public var user_id: Int
    public var scheduled_date: Date?
    public var created_at: Date
    public var updated_at: Date
    public var completed_at: Date?
    public var title: String
    public var is_complete: Bool
    public var is_deleted: Bool
    public var card: PartialCard?

    enum CodingKeys: String, CodingKey {
        case id
        case card_pk
        case user_id
        case scheduled_date
        case created_at
        case updated_at
        case completed_at
        case title
        case is_complete
        case is_deleted
        case card
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        card_pk = try container.decode(Int.self, forKey: .card_pk)
        user_id = try container.decode(Int.self, forKey: .user_id)
        created_at = try container.decode(Date.self, forKey: .created_at)
        updated_at = try container.decode(Date.self, forKey: .updated_at)
        title = try container.decode(String.self, forKey: .title)
        is_complete = try container.decode(Bool.self, forKey: .is_complete)
        is_deleted = try container.decode(Bool.self, forKey: .is_deleted)

        let scheduledDateString = try container.decodeIfPresent(
            String.self,
            forKey: .scheduled_date
        )
        scheduled_date = parseDate(input: scheduledDateString)
        let completedAtString = try container.decodeIfPresent(
            String.self,
            forKey: .completed_at
        )
        completed_at = parseDate(input: completedAtString)
        card = try container.decodeIfPresent(PartialCard.self, forKey: .card)
    }

    public init(
        id: Int,
        card_pk: Int,
        user_id: Int,
        scheduled_date: Date?,
        created_at: Date,
        updated_at: Date,
        completed_at: Date?,
        title: String,
        is_complete: Bool,
        is_deleted: Bool,
        card: PartialCard?
    ) {
        self.id = id
        self.card_pk = card_pk
        self.user_id = user_id
        self.scheduled_date = scheduled_date
        self.created_at = created_at
        self.updated_at = updated_at
        self.completed_at = completed_at
        self.title = title
        self.is_complete = is_complete
        self.is_deleted = is_deleted
        self.card = card
    }
}
