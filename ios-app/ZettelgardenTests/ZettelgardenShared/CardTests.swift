//
//  CardTests.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-09-20.
//
import XCTest

@testable import ZettelgardenShared

class CardTests: XCTestCase {
    func testSortCardIds() {
        let input = [
            "2/A.3/B", "10/A.2/B", "B10/B.5", "1/A.1/A", "3/B.1/C", "4/A.5/D",
            "2/A.10/A", "5/B.2/B", "A2/A.1", "3/A.6/A", "11/A.1/B", "1/B.1/A", "A1/A.10",
        ]

        let expectedOutput = [
            "1/A.1/A", "1/B.1/A", "2/A.3/B", "2/A.10/A", "3/A.6/A", "3/B.1/C",
            "4/A.5/D", "5/B.2/B", "10/A.2/B", "11/A.1/B", "A1/A.10", "A2/A.1", "B10/B.5",
        ]

        let result = sortCardIds(input: input)
        assert(result == expectedOutput, "Test failed")
        print("Test passed!")
    }

}
