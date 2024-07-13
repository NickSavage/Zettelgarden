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
    @ObservedObject var partialViewModel: PartialCardViewModel

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    CardListView(
                        isMenuOpen: $isMenuOpen,
                        selection: $selection,
                        cardViewModel: cardViewModel,
                        viewModel: partialViewModel
                    )
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            selection = .tasks
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "list.bullet.clipboard")
                        }
                        Spacer()
                        Button(action: {
                            selection = .files
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "folder")
                        }
                        .padding()

                        Spacer()
                        Button(action: {
                            selection = .search
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "magnifyingglass")
                        }
                        .padding()
                        Spacer()
                        Button(action: {
                            selection = .settings
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Image(systemName: "gear")
                        }
                        Spacer()
                    }
                    .background(Color.white)
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
        @State private var selection: ContentViewSelection = .tasks
        @ObservedObject var cardViewModel = CardViewModel()
        @ObservedObject var partialViewModel = PartialCardViewModel()

        var body: some View {
            SidebarView(
                isMenuOpen: $isMenuOpen,
                selection: $selection,
                cardViewModel: cardViewModel,
                partialViewModel: partialViewModel
            )
        }
    }
}
