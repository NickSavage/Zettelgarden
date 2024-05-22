//
//  SidebarView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-22.
//

import SwiftUI

struct SidebarView: View {
    @Binding var isMenuOpen: Bool
    @Binding var selectedCard: Int
    @StateObject private var viewModel = PartialCardViewModel()

    var body: some View {

        ZStack {
            if isMenuOpen {
                VStack {
                    VStack {
                        FilterFieldView(filterText: $viewModel.filterText, placeholder: "Filter")
                        if viewModel.isLoading {
                            ProgressView("Loading")
                        }
                        else if let _ = viewModel.cards {
                            List {
                                ForEach(viewModel.filteredCards) { card in
                                    Button(action: {
                                        print(card.card_id)
                                        selectedCard = card.id
                                        isMenuOpen.toggle()
                                    }) {
//                                        Text(card.title)
                                        CardListItem(card: card)
                                    }
                                }
                            }
                        }
                    }
                    .onAppear {
                        viewModel.displayOnlyTopLevel = true
                        viewModel.loadCards()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.white)
                .transition(.move(edge: .leading))
                .toolbar {

                    ToolbarItem(placement: .navigationBarTrailing) {
                        QuickAddMenu()
                    }
                }
            }
        }
    }
}

struct SidebarView_Previews: PreviewProvider {
    static var previews: some View {
        SidebarViewWrapper()
    }

    struct SidebarViewWrapper: View {
        @State private var isMenuOpen = true
        @State private var selectedCard: Int = 1

        var body: some View {
            SidebarView(isMenuOpen: $isMenuOpen, selectedCard: $selectedCard)
        }
    }
}
