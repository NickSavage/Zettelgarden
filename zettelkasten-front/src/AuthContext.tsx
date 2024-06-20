import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { checkAdmin } from "./api/users";
import { getCurrentUser } from "./api/users";
import { LoginResponse } from "./models/Auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  loginUser: (data: LoginResponse) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
    const [isActive, setIsActive] = useState("inactive");

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthenticated(true);
        // Assume checkAdmin will resolve to true/false based on the admin status
        const adminStatus = await checkAdmin();
        setIsAdmin(adminStatus);
	  const currentUser = await getCurrentUser();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = (data: LoginResponse) => {
    localStorage.setItem("token", data["access_token"]);
    localStorage.setItem("username", data["user"]["username"]);
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};