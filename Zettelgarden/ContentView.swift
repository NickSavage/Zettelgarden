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
            CardListView().tabItem{
                Image(systemName: "house.fill")
                Text("Home")
            }
            SearchView().tabItem{
                Image(systemName: "house.fill")
                Text("Search")
            }
            SettingsView().tabItem{
                Image(systemName: "house.fill")
                Text("Settings")
            }
        }
    }
}

#Preview {
    ContentView()
}
