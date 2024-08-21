//
//  SettingsView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-15.
//

import SwiftUI

struct SettingsView: View {
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @AppStorage("jwt", store: UserDefaults(suiteName: "com.zettelgarden.sharedSuite")) private
        var jwt: String?

    var body: some View {
        Form {
            Section(header: Text("Environment")) {
                EnvironmentSelectorView()
            }
        }
        Button(action: {
            SwiftUI.Task {
                doLogout()
            }
        }) {
            Text("Logout")
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red)
                .foregroundColor(.white)
                .cornerRadius(8)
        }
        .padding(.horizontal)
    }

    func doLogout() {
        jwt = ""
        isLoggedIn = false
    }

}

#Preview {
    SettingsView()
}
