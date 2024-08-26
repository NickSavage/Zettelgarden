import Foundation

public struct HttpSession {
    public var token: String?
    public var environment: String
}

public enum AppEnvironment: String {
    case development = "https://nicksavage.ca/zettel-dev/api"
    case production = "https://zettelgarden.com/api"
}

public func openSession(token: String?, environment: AppEnvironment) -> HttpSession {
    let session = HttpSession(
        token: token,  // Set the token parameter
        environment: environment.rawValue  // Set the environment
    )
    return session
}

public struct GenericResponse: Encodable, Decodable {
    public var Message: String
    public var Error: Bool
}

public struct IdentifiableURL: Identifiable {
    public var id: UUID
    public var url: URL

    public init(url: URL) {
        self.id = UUID()
        self.url = url
    }
}
