//
//  TokenManager.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Foundation

public class TokenManager {
    
    public static let shared = TokenManager() // Singleton instance
    
    private let keychainManager = KeychainManager.shared
    private let userDefaults = UserDefaults.standard
    
    private let tokenKey = "userToken"
    
    private init() { } // Prevent external initialization
    
    // Save token into Keychain
    public func saveToken(_ token: String) {
        keychainManager.saveToken(token, forKey: tokenKey)
    }
    
    // Retrieve token from Keychain
    public func getToken() -> String? {
        return keychainManager.getToken(forKey: tokenKey)
    }
    
    // Delete token from Keychain
    public func deleteToken() {
        keychainManager.deleteToken(forKey: tokenKey)
    }
}
