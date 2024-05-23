//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    @State var isMenuOpen: Bool = false
    @State var selectedCard: Int = -1
    @State var selection: ContentViewSelection = .home

    var body: some View {
        NavigationView {
            VStack {
                if selection == .home {
                    Text("home")
                }
                else if selection == .card {
                    Text("card")
                }
                TabView {
                    HomeView().tabItem {
                        Image(systemName: "house.fill")
                        Text("Home")
                    }
                    CardDisplayView(cardPK: selectedCard).tabItem {
                        Image(systemName: "house.fill")
                        Text("Card")
                    }
                    SearchView().tabItem {
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
                    selectedCard: $selectedCard,
                    selection: $selection
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
