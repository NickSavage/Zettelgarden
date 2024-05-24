//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    @Binding var selection: ContentViewSelection
    @ObservedObject var cardViewModel: CardViewModel
    @StateObject private var viewModel = PartialCardViewModel()

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    CardListView(
                        isMenuOpen: $isMenuOpen,
                        selection: $selection,
                        cardViewModel: cardViewModel
                    )
                    Spacer()
                    HStack {
                        Button(action: {
                            selection = .files
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "folder")
                            Text("Files")
                        }
                        .padding()

                        Button(action: {
                            selection = .search
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "magnifyingglass")
                            Text("Search")
                        }
                        .padding()
                    }
                    .background(Color.gray.opacity(0.2))
                    .frame(maxWidth: .infinity)
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
        @State private var selection: ContentViewSelection = .home
        @ObservedObject var cardViewModel = CardViewModel()

        var body: some View {
            SidebarView(
                isMenuOpen: $isMenuOpen,
                selection: $selection,
                cardViewModel: cardViewModel
            )
        }
    }
}
