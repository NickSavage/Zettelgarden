import Foundation
import ZettelgardenShared

//var baseUrl = "https://zettelgarden.com/api"
//var baseUrl = "https://nicksavage.ca/zettel-dev/api"
//vvar baseUrl = "http://192.168.0.72:5000/api"

struct Wrapper: Codable {
    var access_token: String
}
func login(email: String, password: String) async throws -> String {
    let baseUrl: String = SettingsManager.shared.currentEnvironment.rawValue
    let url = URL(string: baseUrl + "/login")!
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
