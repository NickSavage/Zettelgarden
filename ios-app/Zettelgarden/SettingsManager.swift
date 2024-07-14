import Foundation

enum Env: String {
    case development = "https://nicksavage.ca/zettel-dev/api"
    case production = "https://zettelgarden.com/api"
}

class SettingsManager {
    static let shared = SettingsManager()

    private let defaults = UserDefaults.standard
    private let environmentKey = "selectedEnvironment"

    var currentEnvironment: Env {
        get {
            if let savedEnvironment = defaults.string(forKey: environmentKey),
                let environment = Env(rawValue: savedEnvironment)
            {
                return environment
            }
            return .development  // Default to development if not set
        }
        set {
            defaults.set(newValue.rawValue, forKey: environmentKey)
        }
    }
}
