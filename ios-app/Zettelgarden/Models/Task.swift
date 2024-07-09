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
    var created_at: Date
    var updated_at: Date
    var completed_at: String?
    var title: String
    var is_complete: Bool
    var is_deleted: Bool
    //    var card: PartialCard
}
func formatDate(date: Date) -> String {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"  // Specify your desired format

    let dateString = dateFormatter.string(from: date)
    return dateString
}
extension Task {

    static var sampleData: [Task] =
        [
            Task(
                id: 1,
                card_pk: 1,
                user_id: 1,
                scheduled_date: Date(),
                //                scheduled_date: formatDate(date: Date()),
                created_at: Date(),
                updated_at: Date(),
                //created_at: formatDate(date: Date()),
                //updated_at: formatDate(date: Date()),
                title: "This is a task",
                is_complete: false,
                is_deleted: false
                    // card: PartialCard(
                    //     id: 1,
                    //     card_id: "1",
                    //     title: "hello world",
                    //     created_at: Date(),
                    //     updated_at: Date()
                    // )
            ),
            Task(
                id: 2,
                card_pk: 1,
                user_id: 1,
                scheduled_date: Date(),
                //scheduled_date: formatDate(date:Date()),
                created_at: Date(),
                updated_at: Date(),
                //created_at: formatDate(date: Date()),
                //updated_at: formatDate(date: Date()),
                title: "This is another task",
                is_complete: false,
                is_deleted: false
                    // card: PartialCard(
                    //     id: 1,
                    //     card_id: "1",
                    //     title: "hello world",
                    //     created_at: Date(),
                    //     updated_at: Date()
                    // )
            ),
        ]
}
