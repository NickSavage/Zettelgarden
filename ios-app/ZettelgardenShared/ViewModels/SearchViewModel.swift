import Combine
import SwiftUI

public class SearchViewModel: ObservableObject {
    @Published public var searchString: String = ""
    @Published public var searchResults: [Card] = []
    @Published public var isLoading: Bool = false

    private var cancellable: AnyCancellable?
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    public init() {}
    public func search() {
        guard let token = token else {
            print("Token is missing")
            return
        }

        DispatchQueue.main.async {
            self.isLoading = true
        }
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
