import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Comptes de démonstration — à retirer une fois l'API réelle branchée (SYL-18)
const DEMO_ACCOUNTS = {
  demandeur: {
    role: 'DEMANDEUR', nom_complet: 'Aïssatou Ndiaye', email: 'aissatou.ndiaye@example.com',
    est_etudiant: true, statut_verification_etudiant: 'VALIDE',
  },
  agent_dcuve: {
    role: 'AGENT_DCUVE', nom_complet: 'Moussa Diagne', email: 'moussa.diagne@syloc-t.sn',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('syloct_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (profil = 'demandeur') => {
    const account = DEMO_ACCOUNTS[profil];
    setUser(account);
    localStorage.setItem('syloct_user', JSON.stringify(account));
    localStorage.setItem('syloct_access_token', 'demo-token');
    return account;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('syloct_user');
    localStorage.removeItem('syloct_access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}
