import { useEffect, useState } from "react";

import api from "../api/axios";

import {
  getToken,
  getUser,
  removeToken,
  setToken,
  setUser,
} from "../utils/auth";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    removeToken();
    setUserState(null);
    setIsAuthenticated(false);
  };

  // =====================================================
  // VÉRIFICATION DU TOKEN AU CHARGEMENT
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const verifyAuthentication = async () => {
      const token = getToken();
      const savedUser = getUser();

      if (!token || !savedUser) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        await api.get("/auth/verify/");

        if (isMounted) {
          setUserState(savedUser);
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          removeToken();
          setUserState(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyAuthentication();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (email, password) => {
    const response = await api.post("/auth/login/", {
      email,
      password,
    });

    const data = response.data;

    setToken(data.access);
    setUser(data.user);

    setUserState(data.user);
    setIsAuthenticated(true);

    return data;
  };

  // =====================================================
  // MISE À JOUR UTILISATEUR
  // =====================================================

  const updateUser = (newUserData) => {
    setUserState((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...newUserData,
      };

      setUser(updatedUser);

      return updatedUser;
    });
  };

  // =====================================================
  // CONTEXT
  // =====================================================

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    role: user?.role || null,
  };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}