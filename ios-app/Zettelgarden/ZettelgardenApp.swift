//
//  ZettelgardenApp.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-13.
//

import SwiftUI

@main
struct ZettelgardenApp: App {
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    var body: some Scene {
        WindowGroup{
            if isLoggedIn {
                ContentView()
            }
            else {
                LoginView()
            }
        }
    }
}
