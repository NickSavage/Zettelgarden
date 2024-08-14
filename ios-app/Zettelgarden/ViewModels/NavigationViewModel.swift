//
//  NavigationViewModel.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-14.
//

import SwiftUI

class NavigationViewModel: ObservableObject {
    var navigationTree: [Visit] = []
    var currentIndex: Int = -1
    @Published var selection: ContentViewSelection = .tasks

    func previousVisit() {

    }
    func nextVisit() {

    }

}
