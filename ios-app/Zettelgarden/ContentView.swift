//
//  ContentView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import Combine
import SwiftUI
import ZettelgardenShared

struct ContentView: View {
    @State var isMenuOpen: Bool = false
    @Environment(\.scenePhase) private var scenePhase
    @StateObject var cardViewModel = CardViewModel()
    @StateObject var partialCardViewModel = PartialCardViewModel()
    @StateObject var navigationViewModel: NavigationViewModel
    @StateObject var taskListViewModel = TaskListViewModel()
    @StateObject var tagViewModel = TagViewModel()
    @StateObject var fileListViewModel = FileListViewModel()

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
                    CardListView()
                }
                else if navigationViewModel.selection == .card {
                    CardDisplayView()
                }
                else if navigationViewModel.selection == .files {
                    FileListView()
                }
                else if navigationViewModel.selection == .settings {
                    SettingsView()
                }
            }
            .environmentObject(tagViewModel)
            .environmentObject(cardViewModel)
            .environmentObject(partialCardViewModel)
            .environmentObject(navigationViewModel)
            .environmentObject(taskListViewModel)
            .environmentObject(fileListViewModel)
            .overlay {
                SidebarView(
                    isMenuOpen: $isMenuOpen,
                    cardViewModel: cardViewModel,
                    navigationViewModel: navigationViewModel,
                    partialViewModel: partialCardViewModel,
                    taskListViewModel: taskListViewModel,
                    fileListViewModel: fileListViewModel
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
                ToolbarItemGroup(placement: .bottomBar) {
                    HStack {
                        Button(action: {
                            navigationViewModel.previousVisit()
                        }) {
                            Image(systemName: "chevron.left")
                        }

                        Button(action: {
                            navigationViewModel.nextVisit()
                        }) {
                            Image(systemName: "chevron.right")
                        }
                        Spacer()

                    }

                }
            }
        }
        .onAppear {
            partialCardViewModel.displayOnlyTopLevel = true
            partialCardViewModel.loadCards()
            navigationViewModel.visit(page: .tasks)

        }
        .onChange(of: scenePhase) { newPhase in
            partialCardViewModel.onScenePhaseChanged(to: newPhase)
            taskListViewModel.onScenePhaseChanged(to: newPhase)
        }.navigationViewStyle(StackNavigationViewStyle())
    }
}

#Preview {
    ContentView()
}
