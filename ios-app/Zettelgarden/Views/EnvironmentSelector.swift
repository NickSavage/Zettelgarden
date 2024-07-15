//
//  EnvironmentSelector.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-14.
//

import Foundation
import SwiftUI

struct EnvironmentSelectorView: View {
    @State private var selectedEnvironment: Env

    init() {
        _selectedEnvironment = State(initialValue: SettingsManager.shared.currentEnvironment)
    }

    var body: some View {
        Picker("Environment", selection: $selectedEnvironment) {
            Text("Development").tag(Env.development)
            Text("Production").tag(Env.production)
        }
        .pickerStyle(SegmentedPickerStyle())
        .onChange(of: selectedEnvironment) { newValue in
            SettingsManager.shared.currentEnvironment = newValue
        }
    }
}
