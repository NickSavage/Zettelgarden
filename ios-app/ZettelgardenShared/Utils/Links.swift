public func hasLinks(text: String) -> Bool {
    let words = title.split(separator: " ").map(String.init)
    ForEach(words, id: \.self) { word in
        if let url = URL(string: word), UIApplication.shared.canOpenURL(url) {
            return true
        }

    }
    return false
}
