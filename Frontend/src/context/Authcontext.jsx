import React, { createContext, useContext, useState, useEffect } from "react";
 
// Create AuthContext
const AuthContext = createContext();
 
// AuthProvider to wrap the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [userRole, setUserRole] = useState(null); 
 
  // Load user data from localStorage when the app initializes
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");

    if (storedUser && storedRole) {
        setUser(JSON.parse(storedUser)); 
        setUserRole((storedRole));
    } 
}, []);

 
  // Function to log in the user
  const login = (userData) => {
    const { role, ...rest } = userData;
 
    // Store user data in state and localStorage
    setUser(rest);
    setUserRole(role);
    localStorage.setItem("user", JSON.stringify(rest));
    localStorage.setItem("userRole", role);
  };
 
  // Function to log out the user
  const logout = () => {
    setUser(null);
    setUserRole(null);
 
    // Remove user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
  };
 
  return (
<AuthContext.Provider value={{ user, userRole, login, logout }}>
      {children}
</AuthContext.Provider>
  );
};
 
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

 
 