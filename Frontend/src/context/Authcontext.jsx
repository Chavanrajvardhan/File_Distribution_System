import React, { createContext, useContext, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";

// Create AuthContext
const AuthContext = createContext();

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

// AuthProvider to wrap the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();


  // Load user data from localStorage when the app initializes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Make a request to a protected endpoint that validates the tokens
        const response = await fetch("/api/users/validate", {
          credentials: "include", // Important for sending cookies
        });

        console.log("Response: ", response);
        if (response.ok) {
          console.log("User is authenticated");
        
          const userDataString = localStorage.getItem("user"); // Get string from localStorage
          if (!userDataString) {
            console.error("No user data found in localStorage");
            return;
          }
        
          const userData = JSON.parse(userDataString); // ✅ Parse the string into an object
          console.log("User Data in auth: ", userData);
        
          const { role, ...rest } = userData; // ✅ Now destructuring works correctly
          setUser(userData);
          setUserRole(role);
          
          console.log("User Role in auth: ", role); // ✅ Correctly logs the role
        
          setIsAuthenticated(true);
          navigate("/");
        }
         else {
          localStorage.removeItem("user");
          localStorage.removeItem("userRole");
          logout();
        }
      } catch (error) {
        console.error("Auth validation failed:", error);
        logout();
      }
    };

    checkAuthStatus();
  }, []);

  // Function to log in the user
  const login = (userData) => {
    const { role, ...rest } = userData;
    setUser(userData);
    setUserRole(role);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userRole", role);
    setIsAuthenticated(true);
  };

  // Function to log out the user
  const logout = async () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, userRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
