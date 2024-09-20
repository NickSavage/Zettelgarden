import Foundation

public func fetchTags(
    session: HttpSession,
    completion: @escaping (Result<[Tag], Error>) -> Void
) {
    guard let url = URL(string: session.environment + "/tags") else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    let token = session.token ?? ""
    print("Request URL: \(url.absoluteString)")

    performRequest(with: url, token: token, completion: completion)
}
