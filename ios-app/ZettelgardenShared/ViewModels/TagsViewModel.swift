import Combine
import SwiftUI

public class TagViewModel: ObservedObject {
    @Published var tags: [Tag]?
    @Published var isLoading: Bool = true

    public init() {
        loadTags()
    }

    public func loadTags() {

        guard let token = token else {
            print("Token is missing")
            return
        }
        let session = openSession(token: token, environment: environment)
        fetchTasks(session: session) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let fetchedTasks):
                    self.tasks = fetchedTasks
                    self.extractTags(from: fetchedTasks)
                    print(self.existingTags)

                case .failure(let error):
                    print(error)
                    print("Unable to load tasks: \(error.localizedDescription)")
                }
                self.isLoading = false
            }
        }
    }
}
