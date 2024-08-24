//
//  EnvironmentSelector.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-14.
//

import SwiftUI
import ZettelgardenShared

struct EnvironmentSelectorView: View {
    @State private var selectedEnvironment: AppEnvironment

    // Key for UserDefaults
    private let environmentKey = "currentEnvironment"

    init() {
        // Read the saved environment from UserDefaults or default to production
        let savedEnvironment =
            UserDefaults.standard.string(forKey: environmentKey)
            ?? AppEnvironment.production.rawValue
        _selectedEnvironment = State(
            initialValue: AppEnvironment(rawValue: savedEnvironment) ?? .production
        )
    }

    var body: some View {
        Picker("Environment", selection: $selectedEnvironment) {
            Text("Development").tag(AppEnvironment.development)
            Text("Production").tag(AppEnvironment.production)
        }
        .pickerStyle(SegmentedPickerStyle())
        .onChange(of: selectedEnvironment) { newValue in
            // Persist the selected environment to UserDefaults
            UserDefaults.standard.setValue(newValue.rawValue, forKey: environmentKey)
        }
    }
}
