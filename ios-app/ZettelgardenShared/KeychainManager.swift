//
//  KeychainManager.swift
//  ZettelgardenShared
//
//  Created by Nicholas Savage on 2024-08-21.
//

import Security
import Foundation

public class KeychainManager {
    
    public static let shared = KeychainManager() // Singleton instance
    
    private init() { } // Prevent external initialization
    
    func saveToken(_ token: String, forKey key: String) -> Bool {
        let tokenData = token.data(using: .utf8)!
        
        // Check if already exists
        if let _ = getToken(forKey: key) {
            // Update the existing value
            let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                         kSecAttrAccount as String: key]
            
            let attributesToUpdate = [kSecValueData: tokenData]
            
            let status = SecItemUpdate(query as CFDictionary, attributesToUpdate as CFDictionary)
            return status == errSecSuccess
        }
        
        // Add new token
        let query = [kSecClass as String: kSecClassGenericPassword,
                     kSecAttrAccount as String: key,
                     kSecValueData as String: tokenData] as [String: Any]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    func getToken(forKey key: String) -> String? {
        let query = [kSecClass as String: kSecClassGenericPassword,
                     kSecAttrAccount as String: key,
                     kSecReturnData as String: kCFBooleanTrue!,
                     kSecMatchLimit as String: kSecMatchLimitOne] as [String: Any]
        
        var dataTypeRef: AnyObject? = nil
        let status: OSStatus = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess {
            if let retrievedData = dataTypeRef as? Data,
               let token = String(data: retrievedData, encoding: .utf8) {
                return token
            }
        }
        return nil
    }
    
    func deleteToken(forKey key: String) -> Bool {
        let query = [kSecClass as String: kSecClassGenericPassword,
                     kSecAttrAccount as String: key] as [String: Any]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
