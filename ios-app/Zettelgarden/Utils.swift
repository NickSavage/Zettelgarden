import Foundation

enum NetworkError: Error {
    case invalidURL
    case unexpectedResponse
    case noDataReceived
    case decodingError(Error)
}

func performRequest<T: Decodable>(
    with url: URL,
    token: String,
    httpMethod: String = "GET",
    requestBody: Data? = nil,
    completion: @escaping (Result<T, Error>) -> Void
) {
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpMethod = httpMethod

    if let body = requestBody {
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    }

    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print(error)
            completion(.failure(error))
            return
        }

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let statusError = NSError(
                domain: "",
                code: (response as? HTTPURLResponse)?.statusCode ?? 500,
                userInfo: [NSLocalizedDescriptionKey: "Unexpected response"]
            )
            print(statusError)
            completion(.failure(statusError))
            return
        }

        guard let data = data else {
            completion(.failure(NetworkError.noDataReceived))
            return
        }

        // Print the raw data as a string
        if let rawDataString = String(data: data, encoding: .utf8) {
            print("Raw data: \(rawDataString)")
        }
        else {
            print("Unable to convert data to string")
        }

        do {
            let decoder = JSONDecoder()
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
            dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
            decoder.dateDecodingStrategy = .formatted(dateFormatter)

            let results = try decoder.decode(T.self, from: data)
            print(data)
            completion(.success(results))
        }
        catch let decodeError {
            // Print the exact error and raw data for troubleshooting
            print("Decoding error: \(decodeError)")
            if let rawDataString = String(data: data, encoding: .utf8) {
                print("Raw JSON data causing error: \(rawDataString)")
            }
            completion(.failure(NetworkError.decodingError(decodeError)))
        }
    }

    task.resume()
}

func performFileDownloadRequest(
    with url: URL,
    token: String,
    originalFileName: String,
    completion: @escaping (Result<URL, Error>) -> Void
) {
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpMethod = "GET"

    let task = URLSession.shared.downloadTask(with: request) { localURL, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let statusError = NSError(
                domain: "",
                code: (response as? HTTPURLResponse)?.statusCode ?? 500,
                userInfo: [NSLocalizedDescriptionKey: "Unexpected response"]
            )
            completion(.failure(statusError))
            return
        }

        guard let localURL = localURL else {
            completion(.failure(NetworkError.noDataReceived))
            return
        }

        // Get the file extension from the original file name
        let fileExtension = (originalFileName as NSString).pathExtension

        // Create a new URL with the correct extension
        let tempDirectory = FileManager.default.temporaryDirectory
        let newFileURL = tempDirectory.appendingPathComponent(UUID().uuidString)
            .appendingPathExtension(fileExtension)

        do {
            try FileManager.default.moveItem(at: localURL, to: newFileURL)
            completion(.success(newFileURL))
        }
        catch {
            completion(.failure(error))
        }
    }

    task.resume()
}

func cardToPartialCard(card: Card) -> PartialCard {
    return PartialCard(
        id: card.id,
        card_id: card.card_id,
        title: card.title,
        created_at: card.created_at,
        updated_at: card.updated_at
    )
}
