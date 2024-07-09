//
//  Tasks.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-08.
//

import Foundation

func fetchTasks(
    token: String,
    searchTerm: String = "",
    completion: @escaping (Result<[Task], Error>) -> Void
) {

    guard let url = URL(string: baseUrl + "/tasks/") else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}

func fetchTasks(
    token: String,
    id: Int,
    searchTerm: String = "",
    completion: @escaping (Result<[Task], Error>) -> Void
) {

    guard let url = URL(string: baseUrl + "/tasks/" + String(id)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}
