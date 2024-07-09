//
//  HomeView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-21.
//

import SwiftUI

struct HomeView: View {
    @ObservedObject var cardViewModel: CardViewModel
    @StateObject private var recentModel = PartialCardViewModel()
    @StateObject private var taskModel = TaskViewModel()
    var body: some View {
        VStack {
            Text("Recent Cards")
        }
        .onAppear {
            taskModel.loadTasks()
        }
        //     NavigationStack {
        //         Text("recent Cards").bold()

        //         }
        //     }
        // }

    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeViewWrapper()
    }

    struct HomeViewWrapper: View {
        @ObservedObject var cardViewModel = CardViewModel()

        var body: some View {
            HomeView(cardViewModel: cardViewModel)
        }
    }
}
