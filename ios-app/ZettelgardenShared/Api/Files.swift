import Foundation
import SwiftUI
import UniformTypeIdentifiers

func mimeTypeForFile(at url: URL) -> String {
    let fileExtension = url.pathExtension
    if let utType = UTType(filenameExtension: fileExtension) {
        return utType.preferredMIMEType ?? "application/octet-stream"
    }
    return "application/octet-stream"
}

public func fetchFile(
    session: HttpSession,
    fileId: Int,
    originalFileName: String,
    completion: @escaping (Result<URL, Error>) -> Void
) {
    guard let url = URL(string: session.environment + "/files/download/" + String(fileId)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""

    performFileDownloadRequest(
        with: url,
        token: token,
        originalFileName: originalFileName,
        completion: completion
    )
}

public func fetchFiles(
    session: HttpSession,
    completion: @escaping (Result<[File], Error>) -> Void
) {

    guard let url = URL(string: session.environment + "/files") else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""

    performRequest(with: url, token: token, completion: completion)

}

public func editFileImplementation(
    session: HttpSession,
    file: File,
    completion: @escaping (Result<File, Error>) -> Void
) {

    let baseUrl: String = session.environment
    let token = session.token ?? ""
    let urlString = "\(baseUrl)/files/\(file.id)"

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    do {
        let requestData = try JSONEncoder().encode(file)
        print(requestData)
        performRequest(
            with: url,
            token: token,
            httpMethod: "PATCH",
            requestBody: requestData,
            completion: completion
        )
    }
    catch {
        print(error)
        completion(.failure(NetworkError.decodingError(error)))
    }
}

public func uploadFileImplementation(
    fileURL: URL,
    cardPK: Int,
    session: HttpSession,
    completion: @escaping (Result<UploadFileResponse, Error>) -> Void
) {
    let baseUrl: String = session.environment
    let token = session.token ?? ""

    let urlString = "\(baseUrl)/files/upload"
    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    print(request)

    // Create the boundary and Content-Type
    let boundary = UUID().uuidString
    request.setValue(
        "multipart/form-data; boundary=\(boundary)",
        forHTTPHeaderField: "Content-Type"
    )

    // Create the form data
    var body = Data()
    if let fileData = try? Data(contentsOf: fileURL) {
        let maxSize = 10 * 1024 * 1024  // 10 MB
        guard fileData.count <= maxSize else {
            completion(.failure(NetworkError.requestFailed))  // Custom error for file size
            return
        }

        // Append file data
        body.append("\r\n--\(boundary)\r\n".data(using: .utf8)!)
        body.append(
            "Content-Disposition: form-data; name=\"file\"; filename=\"\(fileURL.lastPathComponent)\"\r\n"
                .data(using: .utf8)!
        )
        let mimeType = mimeTypeForFile(at: fileURL)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)

        // Append card_pk
        body.append("\r\n--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"card_pk\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(cardPK)".data(using: .utf8)!)
    }

    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body

    // Perform the request
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print(error)
            completion(.failure(error))
            return
        }
        print(response)

        guard let httpResponse = response as? HTTPURLResponse else {
            print("something has failed")
            completion(.failure(NetworkError.requestFailed))
            return
        }

        if let data = data, let responseBody = String(data: data, encoding: .utf8) {
            // Print the body for debugging
            print("Response Body: \(responseBody)")
        }
        else {
            print("No response data or failed to decode data")
        }
        // Check for a successful HTTP status code.
        if (200...299).contains(httpResponse.statusCode) {
            print(httpResponse)
            // Expect data when the request succeeds
            guard let data = data else {
                completion(.failure(NetworkError.requestFailed))
                return
            }

            do {
                let uploadResponse = try JSONDecoder().decode(UploadFileResponse.self, from: data)
                completion(.success(uploadResponse))
            }
            catch {
                completion(.failure(NetworkError.decodingError(error)))
            }
        }
        else {
            print(httpResponse)
            // Attempt to parse server-provided error information
            if let data = data,
                let serverError = try? JSONSerialization.jsonObject(with: data, options: [])
                    as? [String: Any]
            {
                print("Server error:", serverError)
                // Capture detailed error information for debugging/logging
                let errorMessage = serverError["message"] as? String ?? "Unknown server error"
                completion(
                    .failure(
                        NSError(
                            domain: "ServerError",
                            code: httpResponse.statusCode,
                            userInfo: [NSLocalizedDescriptionKey: errorMessage]
                        )
                    )
                )
            }
            else {
                // Fallback error message if parsing fails
                completion(
                    .failure(
                        NSError(
                            domain: "ServerError",
                            code: httpResponse.statusCode,
                            userInfo: [
                                NSLocalizedDescriptionKey:
                                    "Unknown error with code \(httpResponse.statusCode)"
                            ]
                        )
                    )
                )
            }
        }
    }

    task.resume()
}

public func deleteFileImplementation(
    session: HttpSession,
    file: File,
    completion: @escaping (Result<[File], Error>) -> Void
) {

    let urlString = "\(session.environment)/files/\(file.id)"
    let token = session.token ?? ""

    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }

    performRequest(with: url, token: token, httpMethod: "DELETE", completion: completion)
}
