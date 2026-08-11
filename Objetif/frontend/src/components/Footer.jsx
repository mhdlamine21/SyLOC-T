import { Link } from 'react-router-dom';
import logo from '../assets/logo-syloct.jpg';

export default function Footer() {
  return (
    <footer className="border-t border-navy-pale bg-soft mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src={logo} alt="SyLOC-T" className="h-9 w-9 object-contain" />
            <span className="font-display font-semibold text-navy">SyLOC-T</span>
          </div>
          <p className="text-sm text-muted max-w-xs">
            Système de gestion des locaux du CROUS de Thiès — attribution et suivi des locaux
            commerciaux du site VCN.
          </p>
        </div>
        <div>
          <h5 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Démarches</h5>
          <ul className="space-y-2 text-sm">
            <li><Link to="/inscription" className="hover:text-navy">Créer un compte</Link></li>
            <li><Link to="/connexion" className="hover:text-navy">Se connecter</Link></li>
            <li><Link to="/procedure" className="hover:text-navy">Comprendre la procédure</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Ressources</h5>
          <ul className="space-y-2 text-sm">
            <li><Link to="/locaux" className="hover:text-navy">Types de locaux</Link></li>
            <li><Link to="/actualites" className="hover:text-navy">Actualités</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Bureau du courrier</h5>
          <p className="text-sm text-muted leading-relaxed">
            DCUVE — CROUS de Thiès<br />Campus social, site VCN<br />Thiès, Sénégal<br />contact@syloc-t.sn
          </p>
        </div>
      </div>
      <div className="border-t border-navy-pale">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap justify-between text-xs text-muted">
          <span>© 2026 SyLOC-T — CROUS de Thiès</span>
          <span>Maquette pédagogique — UIDT, Licence 3 Génie Logiciel</span>
        </div>
      </div>
    </footer>
  );
}
