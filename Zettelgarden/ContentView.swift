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

    var body: some View {
        NavigationView {
            VStack {
                TabView {
                    CardDisplayView(cardViewModel: cardViewModel).tabItem {
                        Image(systemName: "house.fill")
                        Text("Card")
                    }
                    SearchView(cardViewModel: cardViewModel).tabItem {
                        Image(systemName: "magnifyingglass")
                        Text("Search")
                    }
                    FileListView().tabItem {
                        Image(systemName: "doc")
                        Text("Files")
                    }
                    SettingsView().tabItem {
                        Image(systemName: "gearshape.fill")
                        Text("Settings")
                    }
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
