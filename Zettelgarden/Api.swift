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

func fetchCards(token: String, searchTerm: String = "", completion: @escaping (Result<[Card], Error>) -> Void) {
    let url = baseUrl + "/cards"
    
    var urlComponents = URLComponents(string: url)!
    if !searchTerm.isEmpty {
        urlComponents.queryItems = [
            URLQueryItem(name: "search_term", value: searchTerm)
        ]
    }
    
    guard let url = urlComponents.url else {
        print("Invalid URL")
        return
    }
    
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let statusError = NSError(domain: "", code: (response as? HTTPURLResponse)?.statusCode ?? 500, userInfo: [NSLocalizedDescriptionKey: "Unexpected response"])
            completion(.failure(statusError))
            return
        }
        
        guard let data = data else {
            let dataError = NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "No data received"])
            completion(.failure(dataError))
            return
        }
        // Print the raw data as a string
        if let rawDataString = String(data: data, encoding: .utf8) {
            print("Raw data: \(rawDataString)")
        } else {
            print("Unable to convert data to string")
        }

        do {
            let decoder = JSONDecoder()
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss z"
            dateFormatter.locale = Locale(identifier: "en_US_POSIX")
            dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
            
            // Set the custom date decoding strategy
            decoder.dateDecodingStrategy = .formatted(dateFormatter)
            let results = try decoder.decode([Card].self, from: data)
            completion(.success(results))
        } catch let decodeError {
            completion(.failure(decodeError))
        }
    }
    
    task.resume()
}
