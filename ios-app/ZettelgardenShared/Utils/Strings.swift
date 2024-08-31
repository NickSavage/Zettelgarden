// Helper extension for regex matching
extension String {
    func matches(for regex: String) -> [String] {
        do {
            let regex = try NSRegularExpression(pattern: regex, options: [])
            let nsString = self as NSString
            let results = regex.matches(
                in: self,
                options: [],
                range: NSRange(location: 0, length: nsString.length)
            )
            return results.map { nsString.substring(with: $0.range) }
        }
        catch let error {
            print("invalid regex: \(error.localizedDescription)")
            return []
        }
    }
}
