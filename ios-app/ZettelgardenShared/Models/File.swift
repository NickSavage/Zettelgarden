//
//  File.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI

public struct File: Identifiable, Codable {
    public var id: Int
    public var name: String
    public var filetype: String
    public var filename: String
    public var size: Int
    public var created_by: Int
    public var updated_by: Int
    public var card_pk: Int
    public var card: PartialCard?
    public var created_at: Date?
    public var updated_at: Date?

    public enum CodingKeys: String, CodingKey {
        case id
        case name
        case filetype
        case filename
        case size
        case created_by
        case updated_by
        case card_pk
        case card
        case created_at
        case updated_at
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        filetype = try container.decode(String.self, forKey: .filetype)
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

    public init(
        id: Int,
        name: String,
        filetype: String,
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
        self.filetype = filetype
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
    public static var sampleData: [File] = [
        File(
            id: 1,
            name: "Sample File",
            filetype: "txt",
            filename: "sample.txt",
            size: 1024,
            created_by: 1,
            updated_by: 1,
            card_pk: 1,
            card: nil,
            created_at: Date(),
            updated_at: Date()
        ),
        File(
            id: 2,
            name: "Another Sample File",
            filetype: "pdf",
            filename: "another_sample.pdf",
            size: 5120,
            created_by: 1,
            updated_by: 1,
            card_pk: 1,
            card: nil,
            created_at: Date(),
            updated_at: Date()
        ),
        File(
            id: 3,
            name: "Yet Another Sample File",
            filetype: "docx",
            filename: "yet_another_sample.docx",
            size: 2048,
            created_by: 1,
            updated_by: 1,
            card_pk: 1,
            card: nil,
            created_at: Date(),
            updated_at: Date()
        ),
    ]
}
