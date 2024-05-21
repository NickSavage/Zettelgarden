//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            HomeView().tabItem {
                Image(systemName: "house.fill")
                Text("Home")
            }
            CardListView().tabItem{
                Image(systemName: "house.fill")
                Text("Cards")
            }
            SearchView().tabItem{
                Image(systemName: "magnifyingglass")
                Text("Search")
            }
            FileListView().tabItem{
                Image(systemName: "doc")
                Text("Files")
            }
            SettingsView().tabItem{
                Image(systemName: "gearshape.fill")
                Text("Settings")
            }
        }
    }
}

#Preview {
    ContentView()
}
