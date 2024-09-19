import Combine
import SwiftUI

public class TagViewModel:
    ObservableObject
{
    @Published public var tags: [Tag]?
    @Published var isLoading: Bool = true

    @AppStorage("jwt", store: UserDefaults(suiteName: "group.zettelgarden")) private
        var token: String?

    @AppStorage("currentEnvironment") private var currentEnvironment: String = AppEnvironment
        .production.rawValue
    var environment: AppEnvironment {
        AppEnvironment(rawValue: currentEnvironment) ?? .production
    }
    public init() {
        loadTags()
    }

    public func loadTags() {

        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)
        fetchTags(session: session) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedTags):
                    self.tags = fetchedTags
                    print(self.tags)

                case .failure(let error):
                    print(error)
                    print("Unable to load tasks: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
    }
}
