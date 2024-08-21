//
//  GenericResponse.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation

public struct GenericResponse: Encodable, Decodable {
    var Message: String
    var Error: Bool
}
