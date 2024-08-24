//
//  Cards.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-22.
//

import Foundation

func fetchCard(session: HttpSession, id: Int, completion: @escaping (Result<Card, Error>) -> Void) {
    guard let url = URL(string: session.environment + "/cards/" + String(id)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""
    performRequest(with: url, token: token, completion: completion)
}

func fetchCards(
    session: HttpSession,
    searchTerm: String = "",
    completion: @escaping (Result<[Card], Error>) -> Void
) {
    var urlComponents = URLComponents(string: session.environment + "/cards?partial=true")!
    let token = session.token ?? ""

    if !searchTerm.isEmpty {
        urlComponents.queryItems = [URLQueryItem(name: "search_term", value: searchTerm)]
    }

    guard let url = urlComponents.url else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}
