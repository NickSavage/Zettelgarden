//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    @State private var isMenuOpen: Bool = false
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

                ZStack {
                    if self.isMenuOpen {
                        VStack {
                            Text("Hello world!")
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.white.opacity(0.8))
                        .transition(.move(edge: .leading))
                    }
                }
            }
            .toolbar {
                ToolbarItem {
                    Button(action: {
                        withAnimation {
                            self.isMenuOpen = true
                        }
                    }) {
                        Text("Open Menu")
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
