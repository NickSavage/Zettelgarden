//
//  Cards.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-22.
//

import Foundation

func fetchCard(token: String, id: Int, completion: @escaping (Result<Card, Error>) -> Void) {
    let baseUrl: String = "https://zettelgarden.com/api"
    guard let url = URL(string: baseUrl + "/cards/" + String(id)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    performRequest(with: url, token: token, completion: completion)
}

func fetchCards(
    token: String,
    searchTerm: String = "",
    completion: @escaping (Result<[Card], Error>) -> Void
) {
    let baseUrl: String = "https://zettelgarden.com/api"
    var urlComponents = URLComponents(string: baseUrl + "/cards?partial=true")!

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
