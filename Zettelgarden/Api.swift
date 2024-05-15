import Foundation

func fetchCards(searchTerm: String = "", completion: @escaping (Result<[Card], Error>) -> Void) {
    let token = "insert token"
    let baseUrl = "https://zettelgarden.com/api/cards"
    
    var urlComponents = URLComponents(string: baseUrl)!
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
