import SwiftUI

struct LoginView: View {
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @State private var loginError: String?
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @AppStorage("jwt") private var jwt: String?

    var body: some View {
        VStack {
            Text("Zettelgarden")
                .font(.largeTitle)
                .padding(.bottom, 20)

            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            if isLoading {
                ProgressView()
                    .padding()
            } else {
                Button(action: {
                    Task {
                        await login()
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
            }

            if let loginError = loginError {
                Text(loginError)
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .padding()
    }

    struct Wrapper: Codable {
        var access_token: String
    }

    func login() async {
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
            let url = URL(string: "https://zettelgarden.com/api/login")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let body: [String: String] = ["email": email, "password": password]
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

            let (data, response) = try await URLSession.shared.data(for: request)
            
            // Check if response is a success
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                loginError = "Invalid response from server"
                isLoading = false
                return
            }

            let wrapper = try JSONDecoder().decode(Wrapper.self, from: data)
            print(wrapper)

            // Store the JWT
            jwt = wrapper.access_token
            isLoggedIn = true
        } catch {
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
