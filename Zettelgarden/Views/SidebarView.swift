//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    @Binding var selectedCard: Int
    @StateObject private var viewModel = PartialCardViewModel()

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    CardListView(selectedCard: $selectedCard, isMenuOpen: $isMenuOpen)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white)
                .transition(.move(edge: .leading))
                .toolbar {

                    ToolbarItem(placement: .navigationBarTrailing) {
                        QuickAddMenu()
                    }
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
        @State private var selectedCard: Int = 1

        var body: some View {
            SidebarView(isMenuOpen: $isMenuOpen, selectedCard: $selectedCard)
        }
    }
}
