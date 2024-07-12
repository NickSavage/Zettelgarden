//
//  File.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI

struct File: Identifiable, Codable {
    var id: Int
    var name: String
    var type: String
    var filename: String
    var size: Int
    var created_by: Int
    var updated_by: Int
    var card_pk: Int
    var card: PartialCard?
    var created_at: Date?
    var updated_at: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case type
        case filename
        case size
        case created_by
        case updated_by
        case card_pk
        case card
        case created_at
        case updated_at
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        type = try container.decode(String.self, forKey: .type)
        filename = try container.decode(String.self, forKey: .filename)
        size = try container.decode(Int.self, forKey: .size)
        created_by = try container.decode(Int.self, forKey: .created_by)
        updated_by = try container.decode(Int.self, forKey: .updated_by)
        card_pk = try container.decode(Int.self, forKey: .card_pk)
        card = try container.decodeIfPresent(PartialCard.self, forKey: .card)

        let createdAtString = try container.decode(String.self, forKey: .created_at)
        created_at = parseDate(input: createdAtString) ?? Date()

        let updatedAtString = try container.decode(String.self, forKey: .updated_at)
        updated_at = parseDate(input: updatedAtString) ?? Date()
    }

    init(
        id: Int,
        name: String,
        type: String,
        filename: String,
        size: Int,
        created_by: Int,
        updated_by: Int,
        card_pk: Int,
        card: PartialCard?,
        created_at: Date,
        updated_at: Date
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.filename = filename
        self.size = size
        self.created_by = created_by
        self.updated_by = updated_by
        self.card_pk = card_pk
        self.card = card
        self.created_at = created_at
        self.updated_at = updated_at
    }

}

extension File {
    static var sampleData: File {
        File(
            id: 0,
            name: "Sample file",
            type: "filetype",
            filename: "filename.xlsx",
            size: 100,
            created_by: 1,
            updated_by: 1,
            card_pk: 0,
            card: PartialCard.sampleData[0],
            created_at: Date(),
            updated_at: Date()
        )
    }
}
