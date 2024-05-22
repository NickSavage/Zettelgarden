//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    @State var isMenuOpen: Bool = false
    var body: some View {
        NavigationView {
            TabView {
                HomeView().tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
                CardListView().tabItem {
                    Image(systemName: "house.fill")
                    Text("Cards")
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
            .overlay {
                SidebarView(isMenuOpen: $isMenuOpen)
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        withAnimation {
                            self.isMenuOpen = true
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
