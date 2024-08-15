//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

struct ContentView: View {
    @State var isMenuOpen: Bool = false
    @StateObject var cardViewModel = CardViewModel()
    @StateObject var searchViewModel = SearchViewModel()
    @StateObject var partialViewModel = PartialCardViewModel()
    @StateObject var navigationViewModel: NavigationViewModel

    init() {
        let cardViewModel = CardViewModel()
        _cardViewModel = StateObject(wrappedValue: cardViewModel)
        _navigationViewModel = StateObject(
            wrappedValue: NavigationViewModel(cardViewModel: cardViewModel)
        )
    }

    var body: some View {
        NavigationView {
            VStack {

                if navigationViewModel.selection == .tasks {
                    TaskListView()
                }
                else if navigationViewModel.selection == .home {
                    HomeView(
                        cardViewModel: cardViewModel,
                        navigationViewModel: navigationViewModel,
                        partialViewModel: partialViewModel
                    )
                }
                else if navigationViewModel.selection == .card {
                    CardDisplayView(
                        cardViewModel: cardViewModel,
                        navigationViewModel: navigationViewModel
                    )
                }
                else if navigationViewModel.selection == .files {
                    FileListView()
                }
                else if navigationViewModel.selection == .search {
                    SearchView(
                        cardViewModel: cardViewModel,
                        navigationViewModel: navigationViewModel,
                        viewModel: searchViewModel
                    )
                }
                else if navigationViewModel.selection == .settings {
                    SettingsView()
                }
            }
            .overlay {
                SidebarView(
                    isMenuOpen: $isMenuOpen,
                    cardViewModel: cardViewModel,
                    navigationViewModel: navigationViewModel,
                    partialViewModel: partialViewModel
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
            .toolbar {
                ToolbarItem(placement: .bottomBar) {

                    Button(action: {
                        navigationViewModel.previousVisit()
                    }) {
                        Image(systemName: "chevron.left")
                    }
                }
                ToolbarItem(placement: .bottomBar) {

                    Button(action: {
                        navigationViewModel.nextVisit()
                    }) {
                        Image(systemName: "chevron.right")
                    }
                }
            }
        }
        .onAppear {
            partialViewModel.displayOnlyTopLevel = true
            partialViewModel.loadCards()

        }
    }
}

#Preview {
    ContentView()
}
