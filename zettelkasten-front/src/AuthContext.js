import React, { useEffect, useState, createContext, useContext } from "react";
import { checkAdmin } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthenticated(true);
        // Assume checkAdmin will resolve to true/false based on the admin status
        const adminStatus = await checkAdmin(token);
        setIsAdmin(adminStatus);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = (data) => {
    localStorage.setItem("token", data["access_token"]);
    localStorage.setItem("username", data["user"]["name"]);
    setIsAuthenticated(true);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setIsAdmin(false); // Reset admin status on logout
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, isAdmin, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
