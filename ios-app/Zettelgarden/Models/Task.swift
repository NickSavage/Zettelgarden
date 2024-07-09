//
//  Tasks.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-08.
//

import Combine
import Foundation
import SwiftUI

struct Task: Identifiable, Decodable {
    var id: Int
    var card_pk: Int
    var user_id: Int
    var scheduled_date: Date?
    var due_date: Date?
    var created_at: Date
    var updated_at: Date
    var completed_at: Date?
    var title: String
    var is_complete: Bool
    var is_deleted: Bool
}
