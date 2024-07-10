//
//  GenericResponse.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-10.
//

import Foundation

struct GenericResponse: Encodable, Decodable {
    var Message: String
    var Error: Bool
}
