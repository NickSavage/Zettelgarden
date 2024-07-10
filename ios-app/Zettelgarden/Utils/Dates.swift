//
//  Dates.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Foundation

func isToday(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        print("nope")
        return false
    }

    let calendar = Calendar.current
    let today = Date()

    let todayComponents = calendar.dateComponents([.year, .month, .day], from: today)
    let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)

    print(todayComponents, dateComponents)
    return todayComponents.year == dateComponents.year
        && todayComponents.month == dateComponents.month
        && todayComponents.day == dateComponents.day
}
