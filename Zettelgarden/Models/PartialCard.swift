//
//  PartialCard.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import Foundation

struct PartialCard: Codable {
    var id: Int
    var card_id: String
    var title: String
    var created_at: Date?
    var updated_at: Date?
}
