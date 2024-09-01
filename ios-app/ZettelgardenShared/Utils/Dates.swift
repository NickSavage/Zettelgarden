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

    return calendar.compare(date, to: today, toGranularity: .day) != .orderedDescending
}
public func isPast(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    let today = Date()

    return calendar.compare(date, to: today, toGranularity: .day) == .orderedAscending
}
public func isToday(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    return calendar.isDateInToday(date)
}
public func isTomorrow(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    return calendar.isDateInTomorrow(date)
}
public func isYesterday(maybeDate: Date?) -> Bool {
    guard let date = maybeDate else {
        return false
    }

    let calendar = Calendar.current
    return calendar.isDateInYesterday(date)
}

public func parseDate(input: String?) -> Date? {
    guard let dateString = input else { return nil }

    let isoDateFormatter = DateFormatter()
    isoDateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
    isoDateFormatter.timeZone = TimeZone(secondsFromGMT: 0)

    let alternativeDateFormatter = DateFormatter()
    alternativeDateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
    alternativeDateFormatter.timeZone = TimeZone(secondsFromGMT: 0)

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
public func formatDate(maybeDate: Date?) -> String {
    if isToday(maybeDate: maybeDate) {
        return "Today"
    }
    else if isYesterday(maybeDate: maybeDate) {
        return "Yesterday"
    }
    else if isTomorrow(maybeDate: maybeDate) {
        return "Tomorrow"
    }
    guard let date = maybeDate else {
        return ""
    }

    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "YYYY-MM-dd"
    let result = dateFormatter.string(from: date)
    return result
}
