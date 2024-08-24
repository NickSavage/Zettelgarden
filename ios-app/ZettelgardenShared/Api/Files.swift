import Foundation

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
