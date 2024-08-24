import XCTest

@testable import ZettelgardenShared

class DateParserTests: XCTestCase {

    func testParseDate() {
        // Test standard ISO 8601 format (without fractional seconds)
        XCTAssertEqual(
            parseDate(input: "2023-10-05T15:30:45Z"),
            date(year: 2023, month: 10, day: 5, hour: 15, minute: 30, second: 45)
        )

        // Test invalid date string
        XCTAssertNil(parseDate(input: "2023-10-05"))

        // Test empty string input
        XCTAssertNil(parseDate(input: ""))

        // Test nil input
        XCTAssertNil(parseDate(input: nil))

        // Correct format but incorrect `TimeZone`
        XCTAssertNil(parseDate(input: "2023-10-05T15:30:45+02:00"))

        // Correct format but incorrect separator
        XCTAssertNil(parseDate(input: "2023-10-05T15:30:45_Z"))

        // Random invalid string
        XCTAssertNil(parseDate(input: "NotADate"))

        // ISO 8601 with different delimiter
        XCTAssertNil(parseDate(input: "2023-10-05 15:30:45Z"))

        // ISO 8601 format with time set to 00:00:00
        XCTAssertEqual(
            parseDate(input: "2023-10-05T00:00:00Z"),
            date(year: 2023, month: 10, day: 5, hour: 0, minute: 0, second: 0)
        )

        // Test ISO 8601 format with fractional seconds
        XCTAssertEqual(
            Calendar.current.compare(
                parseDate(input: "2023-10-05T15:30:45.123Z")!,
                to: date(
                    year: 2023,
                    month: 10,
                    day: 5,
                    hour: 15,
                    minute: 30,
                    second: 45,
                    nanosecond: 123_000_000
                ),
                toGranularity: .second
            ),
            .orderedSame
        )
    }

    // Helper function to create date objects for testing
    private func date(
        year: Int,
        month: Int,
        day: Int,
        hour: Int,
        minute: Int,
        second: Int,
        nanosecond: Int = 0
    ) -> Date {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.hour = hour
        components.minute = minute
        components.second = second
        components.nanosecond = nanosecond
        components.timeZone = TimeZone.current
        return Calendar.current.date(from: components)!
    }

    func testIsToday() {
        let today = Date()  // System’s current timezone

        // Test with today's date
        XCTAssertTrue(isToday(maybeDate: today))

        // Create a date for today but with different times to ensure it’s still today
        let todayMorning = Calendar.current.startOfDay(for: today)
        XCTAssertTrue(
            isToday(maybeDate: todayMorning),
            "Should return true for today’s date in the morning"
        )

        // Test with yesterday’s date
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        XCTAssertFalse(isToday(maybeDate: yesterday), "Should return false for yesterday’s date")

        // Test with tomorrow’s date
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        XCTAssertFalse(isToday(maybeDate: tomorrow), "Should return false for tomorrow’s date")
    }

    func testIsTomorrow() {
        let today = Date()  // System’s current timezone

        // Test with tomorrow’s date
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        XCTAssertTrue(isTomorrow(maybeDate: tomorrow), "Should return true for tomorrow’s date")

        // Test with today’s date (should be false)
        XCTAssertFalse(isTomorrow(maybeDate: today), "Should return false for today’s date")

        // Test with a date two days ahead
        let dayAfterTomorrow = Calendar.current.date(byAdding: .day, value: 2, to: today)!
        XCTAssertFalse(
            isTomorrow(maybeDate: dayAfterTomorrow),
            "Should return false for a date two days ahead"
        )

        // Test with yesterday’s date (should be false)
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        XCTAssertFalse(isTomorrow(maybeDate: yesterday), "Should return false for yesterday’s date")
    }

    func testIsPast() {
        let today = Date()  // System’s current timezone

        // Test with yesterday's date
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        XCTAssertTrue(isPast(maybeDate: yesterday), "Should return true for yesterday’s date")

        // Test with tomorrow’s date
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        XCTAssertFalse(isPast(maybeDate: tomorrow), "Should return false for tomorrow’s date")

        // Test with today’s date (should be false)
        XCTAssertFalse(isPast(maybeDate: today), "Should return false for today’s date")
    }

    func testIsTodayOrPast() {
        let today = Date()  // System’s current timezone

        // Test with today’s date
        XCTAssertTrue(isTodayOrPast(maybeDate: today), "Should return true for today’s date")

        // Test with yesterday’s date
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        XCTAssertTrue(
            isTodayOrPast(maybeDate: yesterday),
            "Should return true for yesterday’s date"
        )

        // Test with tomorrow’s date
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        XCTAssertFalse(
            isTodayOrPast(maybeDate: tomorrow),
            "Should return false for tomorrow’s date"
        )
    }

    func testEdgeCases() {
        let today = Date()

        // Test very first second of today
        let startOfToday = Calendar.current.startOfDay(for: today)
        XCTAssertTrue(
            isToday(maybeDate: startOfToday),
            "Should return true for the very first second of today"
        )
        XCTAssertTrue(
            isTodayOrPast(maybeDate: startOfToday),
            "Should return true for the very first second of today"
        )
        XCTAssertFalse(
            isPast(maybeDate: startOfToday),
            "Should return false for the very first second of today"
        )

        // Test last moment of today
        var lastComponents = Calendar.current.dateComponents([.year, .month, .day], from: today)
        lastComponents.hour = 23
        lastComponents.minute = 59
        lastComponents.second = 59
        let lastMomentOfToday = Calendar.current.date(from: lastComponents)!

        XCTAssertTrue(
            isToday(maybeDate: lastMomentOfToday),
            "Should return true for the last second of today"
        )
        XCTAssertTrue(
            isTodayOrPast(maybeDate: lastMomentOfToday),
            "Should return true for the last second of today"
        )
        XCTAssertFalse(
            isPast(maybeDate: lastMomentOfToday),
            "Should return false for the last second of today"
        )
    }
}
