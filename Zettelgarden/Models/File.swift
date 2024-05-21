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
    var created_at: Date
    var updated_at: Date
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
