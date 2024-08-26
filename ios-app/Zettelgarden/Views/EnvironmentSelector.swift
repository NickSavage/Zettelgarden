//
//  EnvironmentSelector.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-14.
//

import SwiftUI
import ZettelgardenShared

struct EnvironmentSelectorView: View {
    // Using @AppStorage to persist and retrieve the selected environment
    @AppStorage("currentEnvironment") private var selectedEnvironment: String = AppEnvironment
        .production.rawValue

    var body: some View {
        Picker(
            "Environment",
            selection: Binding(
                get: {
                    AppEnvironment(rawValue: selectedEnvironment) ?? .production
                },
                set: { newValue in
                    selectedEnvironment = newValue.rawValue
                }
            )
        ) {
            Text("Development").tag(AppEnvironment.development)
            Text("Production").tag(AppEnvironment.production)
        }
        .pickerStyle(SegmentedPickerStyle())
    }
}
