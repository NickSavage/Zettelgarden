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
    @ObservedObject var taskListViewModel: TaskListViewModel

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    VStack {
                        List {
                            Section(header: Text("Creation")) {
                                Button(action: {}) {
                                    Text("New Card")
                                }
                                Button(action: {}) {
                                    Text("New Task")
                                }

                            }
                            Section(header: Text("Navigation")) {
                                Button(action: {
                                    navigationViewModel.visit(page: .home)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    HStack {
                                        Text("Cards")
                                        Spacer()
                                        Text("\(taskListViewModel.countTodayTasks())")
                                    }
                                }
                                Button(action: {
                                    navigationViewModel.visit(page: .tasks)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    Text("Tasks")
                                }
                                Button(action: {
                                    navigationViewModel.visit(page: .files)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    Text("Files")
                                }
                                Button(action: {
                                    navigationViewModel.visit(page: .search)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    Text("Search")
                                }
                                Button(action: {
                                    navigationViewModel.visit(page: .settings)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    Text("Settings")
                                }
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white)
                .transition(.move(edge: .leading))
            }
        }
    }
}
