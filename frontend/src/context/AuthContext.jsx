import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_ACCOUNTS } from '../mocks/data';

const AuthContext = createContext(null);

const TOKEN_KEY = 'syloct_access_token';
const USER_KEY  = 'syloct_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) setUserState(JSON.parse(savedUser));
    } catch (_) {
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connexion — deux modes :
   *  1. clé demo  (ex. 'demandeur', 'agent_dcuve') → compte de démo local
   *  2. objet user → utilisé par le formulaire quand l'API réelle répondra
   */
  const login = (profileKeyOrUser, token = 'demo-token') => {
    let account;
    if (typeof profileKeyOrUser === 'string') {
      account = DEMO_ACCOUNTS[profileKeyOrUser] ?? DEMO_ACCOUNTS.demandeur;
    } else {
      account = profileKeyOrUser;
    }
    setUserState(account);
    localStorage.setItem(USER_KEY, JSON.stringify(account));
    localStorage.setItem(TOKEN_KEY, token);
    return account;
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const updateUser = (patch) => {
    const updated = { ...user, ...patch };
    setUserState(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, role, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans <AuthProvider>');
  return ctx;
}
