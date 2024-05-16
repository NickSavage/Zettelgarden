import SwiftUI
import Combine

class SearchViewModel: ObservableObject {
    @Published var searchString: String = ""
    @Published var searchResults: [Card] = []
    @Published var isLoading: Bool = false
    
    private var cancellable: AnyCancellable?
    @AppStorage("jwt") private var token: String?

    func search() {
        guard let token = token else {
            print("Token is missing")
            return
        }
        
        isLoading = true
        
        fetchCards(token: token, searchTerm: searchString) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let cards):
                    self?.searchResults = cards
                case .failure(let error):
                    print("Error fetching cards: \(error.localizedDescription)")
                }
                self?.isLoading = false
            }
        }
    }
}
