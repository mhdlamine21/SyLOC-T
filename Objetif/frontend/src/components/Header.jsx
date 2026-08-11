import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-syloct.jpg';

const navLinks = [
  { to: '/locaux', label: 'Locaux' },
  { to: '/procedure', label: 'Procédure' },
  { to: '/actualites', label: 'Actualités' },
];

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-navy-pale">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="SyLOC-T" className="h-11 w-11 object-contain" />
          <div className="leading-tight">
            <div className="font-display font-semibold text-navy text-[15px]">SyLOC-T</div>
            <div className="text-[10.5px] uppercase tracking-wide text-muted">Système de gestion des locaux — CROUS de Thiès</div>
          </div>
        </Link>

        <nav className="hidden md:flex gap-1">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded text-sm font-medium ${isActive ? 'text-navy bg-navy-pale' : 'text-muted hover:text-navy'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/app" className="text-sm font-semibold text-navy hover:underline">Mon espace</Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-sm font-semibold text-danger px-3 py-2 rounded hover:bg-danger-soft"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="text-sm font-semibold text-navy px-4 py-2.5 rounded border border-navy hover:bg-navy-pale">
                Se connecter
              </Link>
              <Link to="/inscription" className="text-sm font-semibold text-white bg-navy px-4 py-2.5 rounded hover:bg-navy-deep">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
