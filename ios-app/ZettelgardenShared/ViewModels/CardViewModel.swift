import Combine
import Foundation
import SwiftUI

public class CardViewModel: ObservableObject {
    @Published public var card: Card?
    var cardHistory: [Int] = []
    var currentIndex: Int = -1
    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }

    public init() {}

    public func loadTestCard(card: Card) {
        self.card = card
    }
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
        let session = openSession(token: token, environment: environment)
        fetchCard(session: session, id: cardPK) { result in
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

    public func sendDeleteCard() {

        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)

        if let card = self.card {
            deleteCard(session: session, card: card) { result in
                switch result {
                case .success(let savedCard):
                    print("success!")
                case .failure(let error):
                    print("Failed to delete existing card: \(error)")
                }
            }

        }
    }
    public func saveCard() {

        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)

        if let card = self.card {
            saveExistingCard(session: session, card: card) { result in
                switch result {
                case .success(let savedCard):
                    print("success!")
                case .failure(let error):
                    print("Failed to save existing card: \(error)")
                }
            }

        }
    }
}
