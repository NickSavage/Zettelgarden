//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI
import ZettelgardenShared

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    @ObservedObject var cardViewModel: CardViewModel
    @ObservedObject var navigationViewModel: NavigationViewModel
    @ObservedObject var partialViewModel: PartialCardViewModel
    @ObservedObject var taskListViewModel: TaskListViewModel

    @State private var showingAddTaskView = false
    @State private var showingAddCardView = false
    @State private var showingAddRecordingView = false

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    VStack {
                        List {
                            Section(header: Text("Creation")) {
                                Button(action: {
                                    print("boom")
                                    showingAddCardView.toggle()
                                }) {
                                    Text("New Card")
                                }
                                Button(action: {
                                    showingAddRecordingView.toggle()
                                }) {
                                    Text("New Recording")
                                }
                                Button(action: {
                                    showingAddTaskView.toggle()
                                }) {
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
                                    Text("Cards")
                                }
                                Button(action: {
                                    navigationViewModel.visit(page: .tasks)
                                    withAnimation {
                                        isMenuOpen = false
                                    }
                                }) {
                                    HStack {
                                        Text("Tasks")
                                        Spacer()
                                        Text("\(taskListViewModel.countTodayTasks())")
                                    }
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
                .sheet(isPresented: $showingAddTaskView) {
                    AddTaskView(taskListViewModel: taskListViewModel)
                }
                .sheet(isPresented: $showingAddCardView) {
                    AddCardView(cardListViewModel: partialViewModel)
                }
                .sheet(isPresented: $showingAddRecordingView) {
                    AddRecordingView(cardListViewModel: partialViewModel)
                }
            }
        }
    }
}
