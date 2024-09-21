//
//  PartialCardTests.swift
//  ZettelgardenTests
//
//  Created by Nicholas Savage on 2024-08-23.
//

import XCTest

@testable import ZettelgardenShared

class PartialCardTests: XCTestCase {
    func testPartialCardDecoding() throws {
        let jsonString = """
            {
                "id": 850,
                "card_id": "hello world",
                "user_id": 1,
                "title": "Appoeaoeao",
                "created_at": "2023-09-25T12:55:01Z",
                "updated_at": "2023-10-05T20:27:04Z",
                "parent_id": 1
            }
            """

        // Convert JSON string to Data
        let jsonData = jsonString.data(using: .utf8)!

        // DateFormatter to parse dates in ISO8601 format
        let dateFormatter = ISO8601DateFormatter()

        // Expected dates decoded from the JSON
        let expectedCreatedAt = dateFormatter.date(from: "2023-09-25T12:55:01Z")!
        let expectedUpdatedAt = dateFormatter.date(from: "2023-10-05T20:27:04Z")!

        // Decode the JSON data into a PartialCard instance
        let partialCard = try JSONDecoder().decode(PartialCard.self, from: jsonData)

        // Assert all fields are decoded correctly
        XCTAssertEqual(partialCard.id, 850)
        XCTAssertEqual(partialCard.created_at, expectedCreatedAt)
        XCTAssertEqual(partialCard.updated_at, expectedUpdatedAt)
    }
}
