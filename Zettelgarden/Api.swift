import Foundation

//var baseUrl = "https://zettelgarden.com/api"
var baseUrl = "http://192.168.0.72:5000/api"

struct Wrapper: Codable {
    var access_token: String
}
func login(email: String, password: String) async throws -> String {
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

func fetchCard(token: String, id: Int, completion: @escaping (Result<Card, Error>) -> Void) {
    guard let url = URL(string: baseUrl + "/cards/" + String(id)) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    
    performRequest(with: url, token: token, completion: completion)
}

func fetchCards(token: String, searchTerm: String = "", completion: @escaping (Result<[PartialCard], Error>) -> Void) {
    var urlComponents = URLComponents(string: baseUrl + "/cards?partial=true")!
    
    if !searchTerm.isEmpty {
        urlComponents.queryItems = [URLQueryItem(name: "search_term", value: searchTerm), URLQueryItem(name: "partial", value: "true")]
    }
    
    guard let url = urlComponents.url else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    
    print("Request URL: \(url.absoluteString)")
    
    performRequest(with: url, token: token, completion: completion)
}

func saveCard(token: String, card: Card, httpMethod: String, completion: @escaping (Result<Card, Error>) -> Void) {
    print("saveCard")

    var urlString: String
    
    if httpMethod == "POST" {
        urlString = "\(baseUrl)/cards"
    } else if httpMethod == "PUT" {
        urlString = "\(baseUrl)/cards/\(card.id)"
    } else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    
    guard let url = URL(string: urlString) else {
        completion(.failure(NetworkError.invalidURL))
        return
    }
    
    do {
        let requestData = try JSONEncoder().encode(card)
        performRequest(with: url, token: token, httpMethod: httpMethod, requestBody: requestData, completion: completion)
    } catch {
        completion(.failure(NetworkError.decodingError(error)))
    }
}
func saveNewCard(token: String, card: Card, completion: @escaping (Result<Card, Error>) -> Void) {
    print("saveNewCard")
    saveCard(token: token, card: card, httpMethod: "POST", completion: completion)
}

func saveExistingCard(token: String, card: Card, completion: @escaping (Result<Card, Error>) -> Void) {
    print("saveExistingCard")
    saveCard(token: token, card: card, httpMethod: "PUT", completion: completion)
}
