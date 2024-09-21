//
//  Cards.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-09-20.
//
import Foundation

func parseCardId(_ cardId: String) -> [Any] {
    return cardId.split(separator: "/").flatMap { part -> [Any] in
        part.split(separator: ".").map { segment in
            if let number = Int(segment) {
                return number
            }
            else {
                return String(segment)
            }
        }
    }
}

func compareCardIds(_ a: String, _ b: String) -> Bool {
    let aParts = parseCardId(a)
    let bParts = parseCardId(b)

    let minLength = min(aParts.count, bParts.count)

    for i in 0..<minLength {
        let aPart = aParts[i]
        let bPart = bParts[i]

        if let aNum = aPart as? Int, let bNum = bPart as? Int {
            if aNum != bNum {
                return aNum < bNum
            }
        }
        else if let aStr = aPart as? String, let bStr = bPart as? String {
            if aStr != bStr {
                return aStr < bStr
            }
        }
        else {
            // Handle unexpected mismatch between types of segments
            return (aPart is Int) ? true : false
        }
    }

    // If all parts match, the shorter ID comes first
    return aParts.count < bParts.count
}

public func sortCardIds(input: [String]) -> [String] {
    return input.sorted(by: compareCardIds)
}

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
