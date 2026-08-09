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

function hasStoredSession() {
  return Boolean(getToken() && getUser());
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(hasStoredSession);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    removeToken();
    setUserState(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!hasStoredSession()) {
      return;
    }

    let isMounted = true;
    const savedUser = getUser();

    api
      .get("/auth/verify/")
      .then(() => {
        if (isMounted) {
          setUserState(savedUser);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    const data = response.data;
    setToken(data.access);
    setUser(data.user);
    setUserState(data.user);
    setIsAuthenticated(true);
    return data;
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
