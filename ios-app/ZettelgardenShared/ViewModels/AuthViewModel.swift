import Combine
import SwiftUI

public class AuthViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published public var email: String = ""
    @Published public var password: String = ""
    @Published public var isLoading: Bool = false
    @Published public var loginError: String?

    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private var jwt:
        String?
    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue

    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    public init() {}

    // MARK: - Methods
    public func doLogin() async {
        guard !email.isEmpty, !password.isEmpty else {
            loginError = "Please enter your email and password"
            return
        }

        isLoading = true
        loginError = nil

        do {
            let session = openSession(token: nil, environment: environment)
            let token = try await login(session: session, email: email, password: password)

            jwt = token
            isLoggedIn = true
        }
        catch {
            loginError = "Login failed: \(error.localizedDescription)"
        }

        isLoading = false
    }
}
