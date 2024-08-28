import SwiftUI
import ZettelgardenShared

struct LoginView: View {
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @State private var loginError: String?
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var jwt: String?

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue

    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    var body: some View {
        VStack {
            Text("Zettelgarden")
                .font(.largeTitle)
                .padding(.bottom, 20)

            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)
                .autocapitalization(.none)
                .autocorrectionDisabled(true)

            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            if isLoading {
                ProgressView()
                    .padding()
            }
            else {
                Button(action: {
                    SwiftUI.Task {
                        await doLogin()
                    }
                }) {
                    Text("Login")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                EnvironmentSelectorView()
            }

            if let loginError = loginError {
                Text(loginError)
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .padding()
    }

    func doLogin() async {
        // Ensure inputs are not empty
        guard !email.isEmpty, !password.isEmpty else {
            print("no email and password entered")
            loginError = "Please enter your email and password"
            return
        }

        // Start loading
        isLoading = true
        loginError = nil

        do {
            let session = openSession(token: nil, environment: environment)
            let token = try await login(session: session, email: email, password: password)

            // Store the JWT
            jwt = token
            isLoggedIn = true
        }
        catch {
            print("Request failed: \(error)")
            loginError = "Login failed: \(error.localizedDescription)"
        }

        // Stop loading
        isLoading = false
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}
