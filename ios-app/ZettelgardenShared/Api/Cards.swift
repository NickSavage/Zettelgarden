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

public func fetchPartialCards(
    session: HttpSession,
    searchTerm: String = "",
    sort: String = "",
    completion: @escaping (Result<[PartialCard], Error>) -> Void
) {

    var urlComponents = URLComponents(string: session.environment + "/cards")!
    var queryItems = [URLQueryItem(name: "partial", value: "true")]
    let token = session.token ?? ""

    if !searchTerm.isEmpty {
        queryItems.append(URLQueryItem(name: "search_term", value: searchTerm))
    }
    if !sort.isEmpty {
        queryItems.append(URLQueryItem(name: "sort_method", value: sort))
    }

    urlComponents.queryItems = queryItems

    guard let url = urlComponents.url else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}

public func fetchRelatedCards(
    session: HttpSession,
    cardPK: Int,
    completion: @escaping (Result<[PartialCard], Error>) -> Void
) {

    var urlComponents = URLComponents(string: session.environment + "/cards/\(cardPK)/related")!
    let token = session.token ?? ""

    guard let url = urlComponents.url else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}

func saveCard(
    session: HttpSession,
    card: Card,
    httpMethod: String,
    completion: @escaping (Result<Card, Error>) -> Void
) {
    let baseUrl: String = session.environment
    let token = session.token ?? ""
    var urlString: String

    if httpMethod == "POST" {
        urlString = "\(baseUrl)/cards"
    }
    else if httpMethod == "PUT" {
        urlString = "\(baseUrl)/cards/\(card.id)"
    }
    else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    do {
        let requestData = try JSONEncoder().encode(card)
        performRequest(
            with: url,
            token: token,
            httpMethod: httpMethod,
            requestBody: requestData,
            completion: completion
        )
    }
    catch {
        completion(.failure(NetworkError.decodingError(error)))
    }
}
public func saveNewCard(
    session: HttpSession,
    card: Card,
    completion: @escaping (Result<Card, Error>) -> Void
) {
    saveCard(session: session, card: card, httpMethod: "POST", completion: completion)
}

public func saveExistingCard(
    session: HttpSession,
    card: Card,
    completion: @escaping (Result<Card, Error>) -> Void
) {
    saveCard(session: session, card: card, httpMethod: "PUT", completion: completion)
}

struct NextCardIDResponse: Codable {
    var next_id: String
}

func getNextCardID(
    session: HttpSession,
    cardType: String,
    completion: @escaping (Result<String, Error>) -> Void
) {
    guard let url = URL(string: session.environment + "/cards/next") else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""

    let requestBody: [String: String] = ["card_type": cardType]
    do {
        let requestData = try JSONSerialization.data(withJSONObject: requestBody, options: [])
        performRequest(with: url, token: token, httpMethod: "POST", requestBody: requestData) {
            (result: Result<NextCardIDResponse, Error>) in
            switch result {
            case .success(let response):
                completion(.success(response.next_id))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    catch {
        completion(.failure(NetworkError.decodingError(error)))
    }
}

func deleteCard(
    session: HttpSession,
    card: Card,
    completion: @escaping (Result<Card, Error>) -> Void
) {
    guard let url = URL(string: session.environment + "/cards/" + String(card.id)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""
    performRequest(with: url, token: token, httpMethod: "DELETE", completion: completion)
}
