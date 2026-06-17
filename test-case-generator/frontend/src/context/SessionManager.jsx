import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Create context
const SessionContext = createContext();

// 2. Provider wrapper
export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. Load session from localStorage on refresh
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // 4. Login function
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // 5. Logout function
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // 6. Update user function
  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const isAuthenticated = !!token;

  return (
    <SessionContext.Provider
      value={{ user, token, login, logout, updateUser, isAuthenticated, loading }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// 6. Custom hook
export const useSession = () => useContext(SessionContext);