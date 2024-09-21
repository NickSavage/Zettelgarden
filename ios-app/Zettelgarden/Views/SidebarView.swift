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
    @ObservedObject var fileListViewModel: FileListViewModel

    @State private var showingAddTaskView = false
    @State private var showingAddCardView = false
    @State private var showingAddRecordingView = false

    @State private var fileURL: URL?
    @State private var showDocumentPicker = false
    @State private var selectedImage: UIImage?
    @State private var showPhotoPicker = false

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
                                Button(action: {
                                    showPhotoPicker.toggle()
                                }) {
                                    Text("New Photo")
                                }
                                Button(action: {
                                    showDocumentPicker.toggle()
                                }) {
                                    Text("New File")
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
                    AddCardView(
                        cardListViewModel: partialViewModel,
                        navigationViewModel: navigationViewModel
                    )
                }
                .sheet(isPresented: $showingAddRecordingView) {
                    AddRecordingView(cardListViewModel: partialViewModel)
                }
                .sheet(
                    isPresented: $showDocumentPicker,

                    onDismiss: {
                        if let url = fileURL {
                            fileListViewModel.uploadFile(url: url, cardPK: -1)
                        }
                    }
                ) {
                    DocumentPicker(fileURL: $fileURL)
                }
                .sheet(
                    isPresented: $showPhotoPicker,
                    onDismiss: {
                    }
                ) {
                    PhotoPicker(image: $selectedImage)
                }
            }
        }
    }
}
