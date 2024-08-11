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
                  List {
                    Button(action: {
                             selection = .home
                             withAnimation {
                               isMenuOpen = false
                             }
                           }) {
                      Text("Cards")
                    }
                    Button(action: {
                             selection = .tasks
                             withAnimation {
                               isMenuOpen = false
                             }
                           }) {
                      Text("Tasks")
                    }
                    Button(action: {
                             selection = .files
                             withAnimation {
                               isMenuOpen = false
                             }
                           }) {
                      Text("Files")
                    }
                    Button(action: {
                             selection = .search
                             withAnimation {
                               isMenuOpen = false
                             }
                           }) {
                      Text("Search")
                    }
                    Button(action: {
                             selection = .settings
                             withAnimation {
                               isMenuOpen = false
                             }
                           }) {
                      Text("Settings")
                    }
                  }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white)
                .transition(.move(edge: .leading))
                }
        }
    }
    }
}
