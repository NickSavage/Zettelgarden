//
//  Dates.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Foundation

public func isTodayOrPast(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    let today = Date()

    let todayComponents = calendar.dateComponents([.year, .month, .day], from: today)
    let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)

    let todayDate = calendar.date(from: todayComponents)!
    let targetDate = calendar.date(from: dateComponents)!

    return targetDate <= todayDate

}

public func isPast(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    let today = Date()

    let todayComponents = calendar.dateComponents([.year, .month, .day], from: today)
    let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)

    let todayDate = calendar.date(from: todayComponents)!
    let targetDate = calendar.date(from: dateComponents)!

    return targetDate < todayDate
}

public func isToday(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    let today = Date()

    let todayComponents = calendar.dateComponents([.year, .month, .day], from: today)
    let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)

    return todayComponents.year == dateComponents.year
        && todayComponents.month == dateComponents.month
        && todayComponents.day == dateComponents.day
}

public func isTomorrow(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }
    let calendar = Calendar.current
    let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date())!
    return calendar.isDate(date, inSameDayAs: tomorrow)
}

public func parseDate(input: String?) -> Date? {
    guard let dateString = input else { return nil }

    let isoDateFormatter = DateFormatter()
    isoDateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
    isoDateFormatter.timeZone = TimeZone(secondsFromGMT: 0)

    let alternativeDateFormatter = DateFormatter()
    alternativeDateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
    alternativeDateFormatter.timeZone = TimeZone.current

    if let date = isoDateFormatter.date(from: dateString) {
        return date
    }
    else if let date = alternativeDateFormatter.date(from: dateString) {
        return date
    }
    else {
        print("error")
        return nil
    }
}
