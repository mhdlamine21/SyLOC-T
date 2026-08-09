import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import {
  getToken,
  getUser,
  removeToken,
  setToken,
  setUser,
} from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();

    if (token && savedUser) {
      setUserState(savedUser);
      setIsAuthenticated(true);
      // Vérifier que le token est toujours valide
      api
        .get("/auth/verify/")
        .then(() => {
          setLoading(false);
        })
        .catch(() => {
          logout();
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login/", { email, password });
    setToken(data.access);
    setUser(data.user);
    setUserState(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    removeToken();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    setUserState(updated);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
