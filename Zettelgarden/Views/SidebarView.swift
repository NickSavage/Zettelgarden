//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    Text("Hello world!")
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white.opacity(0.8))
                .transition(.move(edge: .leading))
            }
        }
        .onTapGesture {
            if isMenuOpen {
                withAnimation {
                    isMenuOpen = false
                }
            }
        }
    }
}

struct SidebarView_Previews: PreviewProvider {
    static var previews: some View {
        SidebarViewWrapper()
    }

    struct SidebarViewWrapper: View {
        @State private var isMenuOpen = true

        var body: some View {
            SidebarView(isMenuOpen: $isMenuOpen)
        }
    }
}