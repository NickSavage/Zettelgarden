// AuthContext.js
import React, { useEffect, useState, createContext, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // On component mount, we check if a token exists and consider the user as logged in if it does
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // You would call this function when the user logs in successfully
  const loginUser = (data) => {
    console.log(data);
    localStorage.setItem("token", data["access_token"]);
    localStorage.setItem("username", data["user"]["name"]);
    console.log(data);
    setIsAuthenticated(true);
  };

  // You would call this function to log the user out
  const logoutUser = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context in a component
export const useAuth = () => useContext(AuthContext);
