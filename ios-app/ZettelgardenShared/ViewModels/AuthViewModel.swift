//
//  AuthViewModel.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Combine
import Foundation

public class AuthViewModel: ObservableObject {

    @Published var token: String?

    public init() {
        // Initial setup
    }
    public func loginUser(tokenFromServer: String) {
        TokenManager.shared.saveToken(tokenFromServer)
        token = tokenFromServer
    }

    public func logoutUser() {
        // Clear the token upon logout
        TokenManager.shared.deleteToken()

        // Reset the token state
        token = nil

        print("Token cleared on logout")
    }
}
