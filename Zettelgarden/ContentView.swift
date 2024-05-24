//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    @State var isMenuOpen: Bool = false
    @State var selection: ContentViewSelection = .home
    @StateObject var cardViewModel = CardViewModel()
    @StateObject var searchViewModel = SearchViewModel()

    var body: some View {
        NavigationView {
            VStack {
                if selection == .home {
                    HomeView()
                }
                else if selection == .card {
                    CardDisplayView(cardViewModel: cardViewModel)
                }
                else if selection == .files {
                    FileListView()
                }
                else if selection == .search {
                    SearchView(selection: $selection, cardViewModel: cardViewModel, viewModel: searchViewModel)
                }
                else if selection == .settings {
                    SettingsView()
                }
            }
            .overlay {
                SidebarView(
                    isMenuOpen: $isMenuOpen,
                    selection: $selection,
                    cardViewModel: cardViewModel
                )
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        withAnimation {
                            self.isMenuOpen.toggle()
                        }
                    }) {
                        Image(systemName: "sidebar.left")
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
