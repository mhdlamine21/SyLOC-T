import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AppLogo from '../components/common/AppLogo';
import { getPublicStats, getPublicAnnonces } from '../api/dashboard';
import { Modal, Button } from '../components/common/ui';
import toast from 'react-hot-toast';
import localCroustImg from '../assets/local_croust.jpeg';

const STEPS = [
  { idx: 1, icon: '👤', h: '1. Créer un compte', p: 'Inscrivez-vous en quelques minutes avec les informations de votre structure ou de votre matricule étudiant.', who: 'Candidat', col: '#172554' },
  { idx: 2, icon: '📄', h: '2. Déposer une demande', p: 'Choisissez un local dans le catalogue ou faites une demande de construction/rénovation.', who: 'Candidat', col: '#5f7f9c' },
  { idx: 3, icon: '📂', h: '3. Instruction & Courrier', p: 'Le Bureau du Courrier réceptionne les pièces et la DCUVE instruit l\'éligibilité administrative et sanitaire.', who: 'Bureau Courrier / DCUVE', col: '#8a94a6' },
  { idx: 4, icon: '⚖', h: '4. Commission Consultative', p: 'Évaluation technique et formelle par la commission avec notation pondérée.', who: 'Commission Consultative', col: '#93714a' },
  { idx: 5, icon: '🔑', h: '5. Signature & Clés', p: 'Le Service Juridique édite le bail domanial et le candidat récupère son titre d\'occupation.', who: 'Service Juridique', col: '#c9a15c' },
];

const FAQ_ITEMS = [
  {
    q: "Qui peut déposer une candidature pour un local commercial au CROUS-T ?",
    a: "Toute personne physique ou morale (commerçants, artisans, étudiants prestataires, associations) souhaitant exercer une activité commerciale ou de service au sein des campus du CROUS de Thiès."
  },
  {
    q: "Puis-je soumettre un dossier de demande hors période d'appel à candidature ?",
    a: "Oui tout à fait ! Même en dehors des périodes d'appels à candidature, la plateforme SyLOC vous permet de soumettre une demande libre à tout moment depuis votre espace personnel."
  },
  {
    q: "Quels sont les délais moyens d'instruction d'un dossier ?",
    a: "L'instruction d'un dossier par le Bureau du Courrier, la Commission Consultative et la DCUVE dure en moyenne entre 3 et 6 semaines à compter de la réception d'un dossier réputé complet."
  },
  {
    q: "Comment s'effectue le paiement des redevances d'occupation ?",
    a: "Les paiements s'effectuent auprès du Service Comptable via le guichet de caisse en ligne ou physique, avec émission immédiate d'un quitus de paiement officiel."
  },
  {
    q: "Comment contacter le bureau du courrier ou la DCUVE ?",
    a: "Vous pouvez contacter directement le Bureau du Courrier ou la DCUVE via votre espace personnel ou envoyer un e-mail à courrier@crous-thies.sn du lundi au vendredi de 8h à 16h."
  }
];

export default function Home() {
  const { login, isAuthenticated } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [annonces, setAnnonces] = useState([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  
  const [stats, setStats] = useState({
    dossiersTraites: 0,
    locauxGeres: 3,
    tauxConformite: '100 %',
    delaiMoyen: '3-6 sem.'
  });

  useEffect(() => {
    getPublicStats()
      .then((data) => {
        if (data) {
          setStats(prev => ({ 
             ...prev, 
             dossiersTraites: data.demandes_total || 0,
             locauxGeres: data.locaux_total || 3,
             tauxConformite: data.taux_favorable ? `${data.taux_favorable} %` : '100 %'
          }));
        }
      })
      .catch(() => {});

    getPublicAnnonces()
      .then((data) => {
        setAnnonces(data || []);
      })
      .catch((err) => console.error("Erreur annonces", err))
      .finally(() => setLoadingAnnonces(false));
  }, []);

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Connexion réussie !');
      setShowLoginModal(false);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className={`home-page ${dark ? 'dark' : ''}`}>
      {/* ── HEADER NAVIGATION ──────────────────────────────── */}
      <header className="home-header" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '16px 24px', borderBottom: '1px solid var(--border)', 
        background: 'var(--surface-card)', 
        position: 'sticky', top: 0, zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <AppLogo variant={dark ? 'dark' : 'auto'} height={38} />
          <nav style={{ display: 'flex', gap: 18, fontSize: 14, fontWeight: 600 }}>
            <a href="#procedure" style={{ color: 'var(--navy)', textDecoration: 'none' }}>Procédure du Candidat</a>
            <a href="#annonces" style={{ color: 'var(--navy)', textDecoration: 'none' }}>Annonces Officielles</a>
            <a href="#faq" style={{ color: 'var(--navy)', textDecoration: 'none' }}>FAQ</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggle}
            className="theme-toggle-btn"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}
            title={dark ? 'Mode Clair' : 'Mode Sombre'}
          >
            {dark ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
          </button>

          {!isAuthenticated ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLoginModal(!showLoginModal)}
                className="btn btn-outline-navy"
                style={{ fontSize: 13, padding: '9px 18px', borderRadius: 8, fontWeight: 700, border: '1.5px solid var(--navy)', background: 'transparent', color: 'var(--navy)', cursor: 'pointer' }}
              >
                Se connecter
              </button>
              <Link to="/signup" className="btn btn-navy" style={{ textDecoration: 'none', fontSize: 13, padding: '9px 18px', background: 'var(--navy)', color: '#fff', borderRadius: 8, fontWeight: 700 }}>
                Créer un compte
              </Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn btn-gold" style={{ textDecoration: 'none', fontSize: 13, padding: '9px 18px', background: 'var(--gold)', color: '#fff', borderRadius: 8, fontWeight: 700 }}>
              Mon Espace Personnel →
            </Link>
          )}
        </div>
      </header>

      {/* ── POP-UP MODAL DE CONNEXION HAUT À DROITE ───────── */}
      {showLoginModal && (
        <div className="login-modal-popup" style={{
          position: 'fixed',
          top: 70,
          right: 24,
          zIndex: 9999,
          width: 340,
          background: 'var(--surface-card)',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              🔒 Connexion SyLOC-T
            </h3>
            <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
          </div>

          <form onSubmit={handleQuickLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-deep)', display: 'block', marginBottom: 4 }}>⚡ Sélectionner un profil rapide :</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setLoginEmail(e.target.value);
                    setLoginPassword(e.target.value); // Username is the same as the password
                  }
                }}
                style={{ width: '100%', padding: 9, borderRadius: 8, border: '1.5px solid var(--gold)', fontSize: 12.5, fontWeight: 700, background: 'var(--surface-2)', color: 'var(--navy)', cursor: 'pointer' }}
              >
                <option value="">-- Choisir un profil de test --</option>
                <option value="etudiant">🎓 Usager / Candidat (etudiant)</option>
                <option value="occupant">🏪 Occupant Titulaire (occupant)</option>
                <option value="courrier">📥 Bureau du Courrier (courrier)</option>
                <option value="dcuve">📂 Directeur DCUVE (dcuve)</option>
                <option value="commission">👑 Directeur Général CROUS-T (commission)</option>
                <option value="juridique">⚖ Service Juridique (juridique)</option>
                <option value="comptable">💳 Service Comptable (comptable)</option>
                <option value="technique">🔧 Service Technique (technique)</option>
                <option value="terrain">🚨 Agent de Terrain (terrain)</option>
                <option value="qhse">🧹 Bureau QHSE (qhse)</option>
                <option value="communication">📢 Cellule Communication (communication)</option>
                <option value="admin_si">💻 Administrateur Système (admin_si)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: 4 }}>Email / Identifiant *</label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Ex. usager_etudiant"
                style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', color: 'var(--text)' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: 4 }}>Mot de passe *</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Mot de passe"
                style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', color: 'var(--text)' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingLogin}
              style={{
                width: '100%',
                padding: 10,
                background: 'var(--navy)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              {loadingLogin ? 'Connexion...' : 'Se Connecter →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
              Pas encore de compte ? <Link to="/signup" onClick={() => setShowLoginModal(false)} style={{ color: 'var(--gold-deep)', fontWeight: 700 }}>Créer un compte</Link>
            </div>
          </form>
        </div>
      )}

      <main id="main">
        {/* ── HERO SECTION ──────────────────────────────────── */}
        <section className="hero-section" style={{ padding: '48px 24px 32px' }}>
          <div className="hero-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>

            {/* Texte gauche */}
            <div>
              <div className="hero-pill" style={{ display: 'inline-block', background: 'var(--gold-pale)', color: 'var(--gold-deep)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
                Plateforme Officielle du CROUS de Thiès (Site VCN)
              </div>

              <h1 style={{ fontSize: 'clamp(32px,4vw,48px)', lineHeight: 1.15, color: 'var(--navy)', margin: '0 0 18px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Votre local commercial,<br />notre <span style={{ color: 'var(--gold)' }}>priorité.</span>
              </h1>

              <p style={{ maxWidth: 520, color: 'var(--muted)', fontSize: 15.5, lineHeight: 1.75, margin: '0 0 24px' }}>
                SyLOC-T vous accompagne dans toutes vos démarches de demande et de gestion d'occupation commerciale au CROUS-T / VCN : cantines, boutiques et espaces artisanaux.
              </p>

              <div style={{ background: 'var(--gold-soft)', border: '1.5px solid var(--gold)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-deep)', lineHeight: 1.45 }}>
                  <strong>Information importante :</strong> Même en dehors des périodes d'appels à candidature, vous pouvez déposer une demande libre à tout moment depuis votre compte !
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/signup" className="btn btn-navy" style={{ textDecoration: 'none', fontSize: 15, padding: '14px 24px', background: 'var(--navy)', color: '#fff', borderRadius: 10, fontWeight: 700 }}>
                  ✈ Faire une demande
                </Link>
                <a href="#procedure" className="btn btn-outline-gold" style={{ textDecoration: 'none', fontSize: 15, padding: '13px 24px', border: '1px solid var(--gold)', color: 'var(--gold-deep)', borderRadius: 10, fontWeight: 700 }}>
                  📖 Guide du candidat
                </a>
              </div>
            </div>

            {/* Illustration du local commercial + petites cartes d'accès */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 55px rgba(23,37,84,.14)', border: '1px solid var(--border)', maxWidth: 480, margin: '0 auto' }}>
                <img src={localCroustImg} alt="Local CROUS-T" style={{ display: 'block', width: '100%', height: 340, objectFit: 'cover' }} />
              </div>

              {/* Petites cartes d'accès rapide superposées à la fin du cadre photo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: -28, position: 'relative', zIndex: 10, padding: '0 12px' }}>
                {[
                  { icon: '🏢', label: 'Demande local',   action: () => navigate('/signup') },
                  { icon: '🔍', label: 'Suivi dossier',   action: () => setShowLoginModal(true) },
                  { icon: '🔔', label: 'Notifications',   action: () => setShowLoginModal(true) },
                  { icon: '📅', label: 'Échéances',       action: () => setShowLoginModal(true) },
                  { icon: '📄', label: 'Documents',       action: () => setShowLoginModal(true) },
                  { icon: '🎧', label: 'Support & FAQ',   action: () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }) },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={t.action}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── BARRE DE STATISTIQUES DYNAMIQUES DU MYSQL ────── */}
        <div style={{ maxWidth: 1180, margin: '20px auto 40px', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, background: 'var(--surface-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>👥</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{stats.dossiersTraites}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Dossiers enregistrés en base</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>🏢</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{stats.locauxGeres}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Locaux répertoriés (Campus VCN)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>✓</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{stats.tauxConformite}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Taux de conformité QHSE</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>⏱</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{stats.delaiMoyen}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Délai d'instruction moyen</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ANNONCES OFFICIELLES / BULLETIN (Style Corkboard) ── */}
        <section id="annonces" style={{ maxWidth: 1180, margin: '0 auto 60px', padding: '0 24px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 24 }}>
            📢 Tableau d'Affichage Officiel
          </h2>

          {loadingAnnonces ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Chargement des annonces...</div>
          ) : annonces.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 24, 
              background: '#d2b48c', // Couleur liège
              backgroundImage: 'radial-gradient(#b89c77 15%, transparent 16%), radial-gradient(#b89c77 15%, transparent 16%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
              padding: 30, 
              borderRadius: 12,
              border: '8px solid #8b5a2b', // Cadre en bois
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.2)'
            }}>
              {annonces.map((a, i) => (
                <div 
                  key={a.id} 
                  onClick={() => setSelectedAnnonce(a)}
                  style={{ 
                    position: 'relative',
                    background: '#ffffe0', // Papier jaune clair
                    padding: '24px 20px 20px', 
                    boxShadow: '2px 4px 10px rgba(0,0,0,0.3)', 
                    cursor: 'pointer',
                    transform: `rotate(${i % 2 === 0 ? 1.5 : -1.5}deg)`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    color: '#333',
                    fontFamily: 'var(--font-body)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'; e.currentTarget.style.boxShadow = '5px 10px 20px rgba(0,0,0,0.4)'; e.currentTarget.style.zIndex = 10; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? 1.5 : -1.5}deg)`; e.currentTarget.style.boxShadow = '2px 4px 10px rgba(0,0,0,0.3)'; e.currentTarget.style.zIndex = 1; }}
                >
                  {/* Punaise (Pin) */}
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 14,
                    height: 14,
                    background: '#e11d48',
                    borderRadius: '50%',
                    boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), 1px 2px 2px rgba(0,0,0,0.4)'
                  }} />

                  <div style={{ fontSize: 11, color: '#666', marginBottom: 8, marginTop: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                    📅 {new Date(a.date_lancement || a.date_publication).toLocaleDateString('fr-FR')}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172554', margin: '0 0 10px', lineHeight: 1.3 }}>{a.titre}</h3>
                  <p style={{ fontSize: 14, color: '#444', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.description || a.contenu}
                  </p>
                  <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: '#b91c1c', textDecoration: 'underline' }}>
                    Lire la suite →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              background: 'var(--surface-2)', padding: '30px', borderRadius: 14, 
              border: '2px dashed var(--border)', textAlign: 'center', 
              color: 'var(--muted)', fontSize: 16, fontWeight: 600 
            }}>
              📌 Pas d'annonce en cours
            </div>
          )}
        </section>

        {/* Modal Détails Annonce */}
        <Modal 
          open={!!selectedAnnonce} 
          onClose={() => setSelectedAnnonce(null)} 
          title={selectedAnnonce?.titre || "Détails de l'annonce"}
          maxWidth={600}
        >
          {selectedAnnonce && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Lancé le {new Date(selectedAnnonce.date_lancement || selectedAnnonce.date_publication).toLocaleDateString('fr-FR')}
              </div>
              
              <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, background: 'var(--surface-2)', padding: 16, borderRadius: 12, whiteSpace: 'pre-wrap' }}>
                {selectedAnnonce.description || selectedAnnonce.contenu}
              </div>

              {selectedAnnonce.criteres && selectedAnnonce.criteres.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>📋 Critères demandés :</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--slate)' }}>
                    {selectedAnnonce.criteres.map((crit, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {crit.type_critere} - Valeur cible: {crit.valeur_cible} (Poids: {crit.poids})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAnnonce.local && (
                <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>
                  📍 Identifiant du Local ciblé : <span style={{ color: 'var(--gold-deep)' }}>{selectedAnnonce.local}</span>
                </div>
              )}
              
              {selectedAnnonce.date_cloture && (
                <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>
                  ⏳ Clôture prévue le : {new Date(selectedAnnonce.date_cloture).toLocaleDateString('fr-FR')}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <Button variant="ghost" onClick={() => setSelectedAnnonce(null)}>Fermer</Button>
                <Button variant="primary" onClick={() => { 
                  toast.success("Redirection vers le formulaire d'inscription...");
                  navigate('/signup');
                }}>
                  Postuler à cet appel
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── PROCÉDURE DU CANDIDAT (#procedure) ─────────────── */}
        <section id="procedure" style={{ maxWidth: 1180, margin: '0 auto 60px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-deep)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Guide pas à pas
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '6px 0 0' }}>
              Comment obtenir votre local commercial au CROUS-T ?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.idx} style={{ background: 'var(--surface-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 28, marginBottom: 12, display: 'inline-block' }}>{s.icon}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>{s.h}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{s.p}</p>
                </div>
                <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: s.col, background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 6, width: 'fit-content' }}>
                  {s.who}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── QUESTIONS LES PLUS POSÉES (FAQ CENTRÉE) ───────── */}
        <section id="faq" style={{ maxWidth: 860, margin: '0 auto 70px', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-deep)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Besoin d'aide ?
          </span>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', margin: '6px 0 24px' }}>
            Questions les plus posées
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>
                  <span>{item.q}</span>
                  <span style={{ fontSize: 18, color: 'var(--gold-deep)', fontWeight: 800 }}>{openFaqIndex === idx ? '−' : '+'}</span>
                </div>
                {openFaqIndex === idx && (
                  <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER DÉTAILLÉ & RICHE ────────────────────────── */}
      <footer style={{ background: dark ? 'var(--navy-2)' : 'var(--navy)', color: '#fff', padding: '48px 24px 24px', marginTop: 60, borderTop: dark ? '1px solid var(--border)' : 'none' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <AppLogo variant="footer" height={40} />
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              SyLOC-T est le système d'information officiel du Centre Régional des Œuvres Universitaires de Thiès (CROUS-T) pour la gestion et l'attribution domaniale des locaux commerciaux du site VCN.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', marginBottom: 14 }}>Navigation Rapide</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
              <li><a href="#procedure" style={{ color: 'inherit', textDecoration: 'none' }}>Procédure du candidat</a></li>
              <li><Link to="/locaux-catalogue" style={{ color: 'inherit', textDecoration: 'none' }}>Catalogue & Carte GPS Locaux</Link></li>
              <li><a href="#annonces" style={{ color: 'inherit', textDecoration: 'none' }}>Annonces officielles</a></li>
              <li><a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Questions les plus posées</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', marginBottom: 14 }}>Services du CROUS-T</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
              <li>Bureau du Courrier & Réception</li>
              <li>Direction de la Vie Étudiante (DCUVE)</li>
              <li>Service Juridique & Contrats</li>
              <li>Bureau Environnement, Hygiène & QHSE</li>
              <li>Guichet Comptabilité & Caisse</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', marginBottom: 14 }}>Contact & Horaires</h4>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
              📍 Campus VCN - Université Iba Der Thiam de Thiès<br />
              ✉️ courrier@crous-thies.sn<br />
              📞 +221 33 951 12 34<br />
              🕒 Du Lundi au Vendredi : 8h00 - 16h00
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
          © 2026 CROUS de Thiès - SyLOC-T. Tous droits réservés. Plateforme sécurisée conformes aux normes gouvernementales.
        </div>
      </footer>
    </div>
  );
}
