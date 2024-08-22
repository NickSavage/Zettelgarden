//
//  Tasks.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation

public func fetchTasks(
    token: String,
    searchTerm: String = "",
    completion: @escaping (Result<[ZTask], Error>) -> Void
) {
    let baseUrl: String = "https://zettelgarden.com/api"

    guard let url = URL(string: baseUrl + "/tasks") else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}

public func updateTask(
    token: String,
    task: ZTask,
    completion: @escaping (Result<GenericResponse, Error>) -> Void
) {
    let baseUrl: String = "https://zettelgarden.com/api"
    let urlString = "\(baseUrl)/tasks/\(task.id)"

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    do {
        let encoder = JSONEncoder()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        encoder.dateEncodingStrategy = .formatted(dateFormatter)

        let requestData = try encoder.encode(task)
        performRequest(
            with: url,
            token: token,
            httpMethod: "PUT",
            requestBody: requestData,
            completion: completion
        )
    }
    catch {
        completion(.failure(NetworkError.decodingError(error)))
    }
}

public func deleteTask(
    token: String,
    task: ZTask,
    completion: @escaping (Result<[ZTask], Error>) -> Void
) {

    let baseUrl: String = "https://zettelgarden.com/api"
    let urlString = "\(baseUrl)/tasks/\(task.id)"

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    performRequest(with: url, token: token, httpMethod: "DELETE", completion: completion)
}

public func createTask(
    token: String,
    task: ZTask,
    completion: @escaping (Result<CreateTaskResponse, Error>) -> Void
) {
    let baseUrl: String = "https://zettelgarden.com/api"
    let urlString = "\(baseUrl)/tasks"

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    do {
        let encoder = JSONEncoder()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        encoder.dateEncodingStrategy = .formatted(dateFormatter)

        let requestData = try encoder.encode(task)
        performRequest(
            with: url,
            token: token,
            httpMethod: "POST",
            requestBody: requestData,
            completion: completion
        )
    }
    catch {
        completion(.failure(NetworkError.decodingError(error)))
    }
}
