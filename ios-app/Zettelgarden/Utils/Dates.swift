//
//  Dates.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Foundation

func isToday(maybeDate: Date?) -> Bool {
    print(maybeDate)
    if let date = maybeDate {
        let calendar = Calendar.current
        let result = calendar.isDateInToday(date)
        print(result, date)
        return calendar.isDateInToday(date)
    }
    else {
        return false
    }
}
