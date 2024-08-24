import Foundation

struct Wrapper: Codable {
    var access_token: String
}
public func login(session: HttpSession, email: String, password: String) async throws -> String {

    let url = URL(string: session.environment + "/login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let body: [String: String] = ["email": email, "password": password]
    request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
        print(response)
        throw URLError(.badServerResponse)
    }

    let wrapper = try JSONDecoder().decode(Wrapper.self, from: data)
    return wrapper.access_token
}
