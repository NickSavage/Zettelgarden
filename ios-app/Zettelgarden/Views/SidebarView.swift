//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
    @ObservedObject var partialViewModel: PartialCardViewModel

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    List {
                        Button(action: {
                            navigationViewModel.selection = .home
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Text("Cards")
                        }
                        Button(action: {
                            navigationViewModel.selection = .tasks
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Text("Tasks")
                        }
                        Button(action: {
                            navigationViewModel.selection = .files
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Text("Files")
                        }
                        Button(action: {
                            navigationViewModel.selection = .search
                            withAnimation {
                                isMenuOpen = false
                            }
                        }) {
                            Text("Search")
                        }
                        Button(action: {
                            navigationViewModel.selection = .settings
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
