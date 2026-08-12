import { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, verifierSession } from '../api/auth';
import { clearSession, getToken, setSession } from '../api/axios';

const AuthContext = createContext(null);

const USER_KEY = 'syloct_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restauration + vérification réelle de la session auprès de /comptes/me/
  useEffect(() => {
    let monte = true;

    const restaurer = async () => {
      let sauvegarde = null;
      try {
        const brut = localStorage.getItem(USER_KEY);
        if (brut) sauvegarde = JSON.parse(brut);
      } catch {
        localStorage.removeItem(USER_KEY);
      }

      if (!getToken()) {
        if (monte) {
          setUserState(null);
          setLoading(false);
        }
        return;
      }

      if (monte && sauvegarde) setUserState(sauvegarde);

      try {
        const profil = await verifierSession();
        if (!monte) return;
        setUserState(profil);
        localStorage.setItem(USER_KEY, JSON.stringify(profil));
      } catch {
        if (!monte) return;
        clearSession();
        setUserState(null);
      } finally {
        if (monte) setLoading(false);
      }
    };

    restaurer();
    return () => {
      monte = false;
    };
  }, []);

  /** Connexion réelle : identifiant = email ou nom d'utilisateur. */
  const login = async (identifiant, password) => {
    const data = await loginApi(identifiant, password);
    setSession({ access: data.access, refresh: data.refresh, user: data.user });
    setUserState(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setUserState(null);
  };

  const updateUser = (patch) => {
    const updated = { ...user, ...patch };
    setUserState(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const rafraichirProfil = async () => {
    const profil = await verifierSession();
    setUserState(profil);
    localStorage.setItem(USER_KEY, JSON.stringify(profil));
    return profil;
  };

  const isAuthenticated = !!user;
  // Le backend renvoie role_effectif (un USAGER sous contrat devient OCCUPANT).
  const role = user?.role_effectif ?? user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, role, login, logout, updateUser, rafraichirProfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans <AuthProvider>');
  return ctx;
}
