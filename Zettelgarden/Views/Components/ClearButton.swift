import SwiftUI

struct ClearButtonModifier: ViewModifier {
    @Binding var text: String

    func body(content: Content) -> some View {
        ZStack(alignment: .trailing) {
            content
            if !text.isEmpty {
                Button(action: {
                    self.text = ""
                }) {
                    Image(systemName: "multiply.circle.fill")
                        .foregroundColor(.secondary)
                }
                .padding(.trailing, 8)
            }
        }
    }
}

extension View {
    func clearButton(text: Binding<String>) -> some View {
        self.modifier(ClearButtonModifier(text: text))
    }
}
