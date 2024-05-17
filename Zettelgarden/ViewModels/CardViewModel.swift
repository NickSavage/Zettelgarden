import Combine
import Foundation
import SwiftUI

class CardViewModel: ObservableObject {
    @Published var card: Card?
    @Published var isLoading = true
    @AppStorage("jwt") private var token: String?
    
    func loadCard(cardPK: Int) {
        guard let token = token else {
            print("Token is missing")
            return
        }

        fetchCard(token: token, id: cardPK) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedCard):
                    self.card = fetchedCard
                case .failure(let error):
                    print("Unable to load card: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
    }
}
