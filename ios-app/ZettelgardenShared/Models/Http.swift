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
