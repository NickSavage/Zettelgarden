import Combine
import Foundation
import SwiftUI

public class CardViewModel: ObservableObject {
    @Published public var card: Card?
    var cardHistory: [Int] = []
    var currentIndex: Int = -1
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    public init() {}

    public func loadCard(cardPK: Int) {
        guard let token = token else {
            print("Token is missing")
            return
        }
        if currentIndex == -1 {
            cardHistory.append(cardPK)
            currentIndex += 1
        }
        else if currentIndex >= 0 && !(cardHistory[currentIndex] == cardPK) {
            cardHistory.append(cardPK)
            currentIndex += 1
        }
        fetchCard(token: token, id: cardPK) { result in
            switch result {
            case .success(let fetchedCard):
                DispatchQueue.main.async {
                    self.card = fetchedCard
                    print("loaded card \(cardPK)")
                }
            case .failure(let error):
                print("Unable to load card: \(error.localizedDescription)")
            }
        }
    }
    public func previousCard() {
        if currentIndex < 1 {
            print("cannot go back")
            return
        }
        currentIndex -= 1
        loadCard(cardPK: cardHistory[currentIndex])
    }
    public func nextCard() {

        if currentIndex >= cardHistory.count - 1 {
            print("cannot go forward")
            return
        }
        currentIndex += 1

        loadCard(cardPK: cardHistory[currentIndex])
    }
}
