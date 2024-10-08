import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { checkAdmin } from "../api/users";
import { getCurrentUser } from "../api/users";
import { LoginResponse } from "../models/Auth";
import { User } from "../models/User";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasSubscription: boolean;
  loginUser: (data: LoginResponse) => void;
  logoutUser: () => void;
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
        setCurrentUser(currentUser);
        console.log("user", currentUser);
        setHasSubscription(currentUser.stripe_subscription_status === "active");
        //setHasSubscription(true)
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loginUser = (data: LoginResponse) => {
    localStorage.setItem("token", data["access_token"]);
    localStorage.setItem("username", data["user"]["username"]);
    //setHasSubscription(true);
    setHasSubscription(data["user"].stripe_subscription_status === "active");
    setIsAuthenticated(true);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setIsAdmin(false); // Reset admin status on logout
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isAdmin,
        hasSubscription,
        loginUser,
        logoutUser,
        currentUser,
      }}
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
