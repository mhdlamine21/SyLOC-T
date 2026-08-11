import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { locauxMock, DEMO_ACCOUNTS } from '../mocks/data';
import AppLogo from '../components/common/AppLogo';
import toast from 'react-hot-toast';

const DEMO_PROFILES = [
  { key: 'usager',                label: 'Candidat' },
  { key: 'demandeur',             label: 'Étudiant' },
  { key: 'occupant',              label: 'Occupant' },
  { key: 'service_juridique',     label: 'Service Juridique' },
  { key: 'cellule_communication', label: 'Communication' },
  { key: 'service_technique',     label: 'Service Technique' },
  { key: 'service_comptable',     label: 'Comptabilité' },
  { key: 'agent_dcuve',           label: 'Agent DCUVE' },
  { key: 'directeur_dcuve',       label: 'Directeur DCUVE' },
  { key: 'agent_terrain',         label: 'Agent Terrain' },
  { key: 'agent_qhse',            label: 'Bureau QHSE' },
  { key: 'directeur_crous_t',     label: 'Directeur CROUS-T' },
  { key: 'administrateur_si',     label: 'Admin SI' },
];

const NOTICE_ITEMS = [
  {
    id: 'NW-001', pin: 'pin-navy',
    date: '24 Juillet 2026',
    titre: 'Ouverture appel : Kiosque Bloc C',
    contenu: "Un emplacement au rez-de-chaussée du Bloc C se libère. Dossiers acceptés jusqu'au 28 août.",
    bg: '#fffde7',
  },
  {
    id: 'NW-002', pin: 'pin-slate',
    date: '15 Juillet 2026',
    titre: 'Inspections QHSE rentrée 2026',
    contenu: "La Brigade Terrain débute les contrôles de conformité sanitaire à compter du 1er septembre.",
    bg: '#f0f8f5',
  },
  {
    id: 'NW-003', pin: 'pin-gold',
    date: '02 Juillet 2026',
    titre: 'Extension campus pédagogique',
    contenu: "Deux nouveaux emplacements de services seront proposés en octobre prochain.",
    bg: '#fff8f0',
  },
];

const STEPS = [
  { idx: 1, icon: '👤', h: 'Créer un compte',    p: 'Inscrivez-vous en quelques minutes avec les informations de votre structure.', who: 'Espace candidat', col: '#172554' },
  { idx: 2, icon: '📄', h: 'Faire une demande',  p: 'Choisissez le type de local et déposez votre dossier de candidature.', who: 'Espace candidat', col: '#5f7f9c' },
  { idx: 3, icon: '⏳', h: 'Suivi du dossier',   p: 'Suivez l\'avancement en temps réel et complétez si demande de pièces.', who: 'DCUVE', col: '#8a94a6' },
  { idx: 4, icon: '✅', h: 'Résultat commission', p: 'Recevez la décision de la commission par notification et par e-mail.', who: 'Directeur CROUS-T', col: '#93714a' },
  { idx: 5, icon: '🔑', h: 'Signature & remise',  p: 'Signez votre contrat et récupérez les clés de votre local commercial.', who: 'Service Juridique', col: '#c9a15c' },
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
    a: "L'instruction d'un dossier par la Commission Consultative et la DCUVE dure en moyenne entre 3 et 6 semaines à compter de la réception d'un dossier réputé complet."
  },
  {
    q: "Comment s'effectue le paiement des redevances d'occupation ?",
    a: "Les paiements s'effectuent auprès du Service Comptable via le guichet de caisse en ligne ou physique, avec émission immédiate d'un quitus de paiement officiel."
  },
  {
    q: "Comment contacter le bureau du courrier ou la DCUVE ?",
    a: "Vous pouvez contacter directement la DCUVE via votre espace personnel ou envoyer un e-mail à dcuve@crous-t.sn du lundi au vendredi de 8h à 16h."
  }
];

export default function Home() {
  const { login, isAuthenticated } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [showModal, setShowModal]     = useState(false);
  const [selectedKey, setSelectedKey] = useState('usager');
  const [loading, setLoading]         = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const demo = DEMO_ACCOUNTS[selectedKey] || DEMO_ACCOUNTS.usager;
    login(demo, 'demo-token');
    toast.success(`Bienvenue, ${demo.nom_complet} !`);
    setLoading(false);
    setShowModal(false);
    navigate('/dashboard');
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>

      {/* ── HEADER PUBLIC ───────────────────────────────────── */}
      <header className="pub-header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <AppLogo height={42} showText={true} />
        </Link>

        <nav className="pub-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26, color: '#475569', fontSize: 13, fontWeight: 700 }}>
          <a href="#annonces" style={{ textDecoration: 'none', color: 'inherit', paddingBottom: 4 }}>Annonces</a>
          <a href="#procedure" style={{ textDecoration: 'none', color: 'inherit', paddingBottom: 4 }}>Procédure</a>
          <a href="#faq" style={{ textDecoration: 'none', color: 'inherit', paddingBottom: 4 }}>Aide / FAQ</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Mode clair' : 'Mode sombre'}>
            {dark ? '☀️' : '🌙'}
          </button>
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-outline"
                style={{ fontSize: 13, padding: '9px 16px' }}
              >
                Se connecter
              </button>
              <Link to="/signup" className="btn btn-navy" style={{ textDecoration: 'none', fontSize: 13, padding: '9px 16px' }}>
                Créer un compte
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-gold" style={{ textDecoration: 'none', fontSize: 13, padding: '9px 16px' }}>
              Mon espace →
            </Link>
          )}
        </div>
      </header>

      <main id="main">

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="hero-section">
          <div className="hero-grid" style={{ maxWidth: 1180, margin: '0 auto' }}>

            {/* Texte gauche */}
            <div>
              <div className="hero-pill">Plateforme officielle CROUS-T</div>
              <h1 style={{ fontSize: 'clamp(34px,4.6vw,50px)', lineHeight: 1.12, color: 'var(--navy)', margin: '0 0 18px', letterSpacing: '-1px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Votre local commercial,<br />notre <span style={{ color: 'var(--gold)' }}>priorité.</span>
              </h1>
              <p style={{ maxWidth: 520, color: 'var(--muted)', fontSize: 15.5, lineHeight: 1.75, margin: '0 0 24px' }}>
                SyLOC vous accompagne dans toutes vos démarches de demande et de gestion d'occupation commerciale au CROUS-T / VCN : cantines, boutiques et espaces artisanaux.
              </p>
              
              {/* NOTE QUI SCINTILLE / SHIMMER */}
              <div 
                className="note-scintillante"
                style={{
                  background: 'var(--gold-soft)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span className="live-dot" style={{ background: 'var(--gold-deep)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-deep)', lineHeight: 1.45 }}>
                  💡 <strong>Information importante :</strong> Même en dehors des périodes d'appels à candidature, vous pouvez déposer un dossier de demande libre à tout moment depuis votre espace personnel !
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/signup" className="btn btn-navy" style={{ textDecoration: 'none', fontSize: 15, padding: '14px 22px' }}>
                  ✈ Faire une demande
                </Link>
                <a href="#procedure" className="btn btn-outline-gold" style={{ fontSize: 15, padding: '13px 22px' }}>
                  📖 Guide du candidat
                </a>
              </div>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  ['✓', 'Démarches 100 % en ligne', 'var(--navy)'],
                  ['✓', 'Suivi en temps réel', 'var(--slate)'],
                  ['✓', 'Notifications instantanées', 'var(--gold)'],
                ].map(([ico, txt, bg]) => (
                  <span key={txt} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>
                    <i style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{ico}</i>
                    {txt}
                  </span>
                ))}
              </div>
            </div>

            {/* Illustration + tuiles */}
            <div style={{ position: 'relative' }}>
              {/* SVG Illustration du local */}
              <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 55px rgba(23,37,84,.14)', lineHeight: 0 }}>
                <svg viewBox="0 0 600 460" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto' }}>
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#dbe7fb"/><stop offset="1" stopColor="#f3ecdd"/>
                    </linearGradient>
                    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#2b3f6b"/><stop offset="1" stopColor="#172554"/>
                    </linearGradient>
                  </defs>
                  <rect width="600" height="460" fill="url(#sky)"/>
                  <circle cx="500" cy="80" r="46" fill="#f3d9a3" opacity=".8"/>
                  <g opacity=".9" fill="#fff">
                    <ellipse cx="120" cy="70" rx="46" ry="16"/><ellipse cx="160" cy="62" rx="34" ry="14"/>
                    <ellipse cx="400" cy="120" rx="40" ry="14"/><ellipse cx="435" cy="112" rx="28" ry="12"/>
                  </g>
                  <rect x="0" y="330" width="600" height="130" fill="#e7ded0"/>
                  <rect x="0" y="322" width="600" height="10" fill="#cfc3ab"/>
                  <rect x="70" y="150" width="460" height="185" rx="10" fill="url(#wall)"/>
                  <rect x="70" y="150" width="460" height="14" fill="#0f1b3d"/>
                  <g>
                    <rect x="150" y="190" width="300" height="26" fill="#c9a15c"/>
                    <rect x="150" y="190" width="30" height="26" fill="#f4e3c2"/>
                    <rect x="210" y="190" width="30" height="26" fill="#f4e3c2"/>
                    <rect x="270" y="190" width="30" height="26" fill="#f4e3c2"/>
                    <rect x="330" y="190" width="30" height="26" fill="#f4e3c2"/>
                    <rect x="390" y="190" width="30" height="26" fill="#f4e3c2"/>
                    <path d="M150 216 l14 16 h272 l14 -16 Z" fill="#a97c33"/>
                  </g>
                  <rect x="180" y="230" width="240" height="80" rx="4" fill="#cfe0f7" opacity=".9"/>
                  <line x1="300" y1="230" x2="300" y2="310" stroke="#0f1b3d" strokeWidth="3"/>
                  <line x1="180" y1="270" x2="420" y2="270" stroke="#0f1b3d" strokeWidth="3"/>
                  <rect x="90" y="230" width="60" height="80" rx="4" fill="#0f1b3d"/>
                  <circle cx="132" cy="270" r="3" fill="#c9a15c"/>
                  <rect x="255" y="160" width="90" height="24" rx="6" fill="#f4e3c2"/>
                  <text x="300" y="177" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="13" fill="#172554">SyLOC</text>
                  <rect x="440" y="270" width="70" height="45" rx="4" fill="#e7d3a9"/>
                  <rect x="440" y="262" width="70" height="10" rx="3" fill="#93714a"/>
                  <rect x="40" y="290" width="10" height="40" fill="#7a5b2c"/>
                  <circle cx="45" cy="278" r="26" fill="#5f7f9c"/>
                  <circle cx="30" cy="292" r="20" fill="#6b8ba6"/>
                  <circle cx="62" cy="292" r="20" fill="#6b8ba6"/>
                  <rect x="500" y="322" width="60" height="6" fill="#93714a"/>
                  <rect x="505" y="316" width="6" height="12" fill="#7a5b2c"/>
                  <rect x="550" y="316" width="6" height="12" fill="#7a5b2c"/>
                </svg>
              </div>

              {/* Tuiles d'actions */}
              <div className="hero-tiles">
                {[
                  { cls: 'tile-navy',  icon: '🏢', label: 'Demande de local',  action: () => setShowModal(true) },
                  { cls: 'tile-slate', icon: '🔍', label: 'Suivi de dossier',  action: () => setShowModal(true) },
                  { cls: 'tile-stone', icon: '🔔', label: 'Notifications',     action: () => setShowModal(true) },
                  { cls: 'tile-amber', icon: '📅', label: 'Échéances',         action: () => setShowModal(true) },
                  { cls: 'tile-sand',  icon: '📄', label: 'Documents',         action: () => setShowModal(true) },
                  { cls: 'tile-lilac', icon: '🎧', label: 'Support & FAQ',     action: () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }) },
                ].map((t) => (
                  <button key={t.label} className={`hero-tile ${t.cls}`} onClick={t.action}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ─────────────────────────────────────── */}
        <div style={{ maxWidth: 1180, margin: '34px auto 0', padding: '0 clamp(16px,5vw,72px)' }}>
          <div className="stats-bar">
            {[
              { icon: '👥', cls: 'violet', num: '47+',  label: 'Dossiers traités sur la plateforme' },
              { icon: '🏢', cls: 'slate',  num: locauxMock.length.toString(), label: 'Locaux gérés sur le site VCN' },
              { icon: '✓',  cls: 'green',  num: '91%',  label: 'Taux de conformité QHSE' },
              { icon: '⏱',  cls: 'gold',   num: '3–6 sem.', label: 'Délai moyen d\'instruction' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ANNONCES ──────────────────────────────────────── */}
        <section id="annonces" style={{ padding: '80px 0', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px,5vw,72px)' }}>
            <div style={{ maxWidth: 640, marginBottom: 40 }}>
              <div className="hero-eyebrow" style={{ marginBottom: 10 }}>Communication CROUS-T</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--navy)', margin: '0 0 10px', fontWeight: 800 }}>
                Annonces
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Annonces officielles, appels à candidature et avis d'opportunités publiés par la Cellule Communication.
              </p>
            </div>

            {/* Tableau liège */}
            <div style={{ background: '#c9a870', padding: 'clamp(28px,4vw,44px)', position: 'relative', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.12)', borderRadius: 20 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '14px 14px', pointerEvents: 'none', borderRadius: 20 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32, position: 'relative' }}>
                {NOTICE_ITEMS.map((n) => (
                  <div
                    key={n.id}
                    className={`notice-card ${n.pin}`}
                    style={{ background: n.bg }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>{n.date}</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.25, color: 'var(--navy)' }}>{n.titre}</h3>
                    <p style={{ fontSize: 13, color: '#4a4433', lineHeight: 1.65, margin: '0 0 14px' }}>{n.contenu}</p>
                    <button 
                      onClick={() => setShowModal(true)}
                      className="btn btn-navy"
                      style={{ width: '100%', fontSize: 12, padding: '8px 12px', justifyContent: 'center' }}
                    >
                      Consulter / Répondre →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROCÉDURE 5 ÉTAPES ──────────────────────────── */}
        <section id="procedure" style={{ padding: '80px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px,5vw,72px)' }}>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div className="hero-eyebrow">Votre parcours</div>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--navy)', margin: '8px 0 0', fontWeight: 800 }}>
                Comment ça marche ?
              </h2>
            </div>

            <div className="steps5-wrap">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.idx}>
                  <div className="step5">
                    <div className="step5-num" style={{ background: s.col }}>{s.idx}</div>
                    <div style={{ fontSize: 22, marginBottom: 12 }}>{s.icon}</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 700 }}>{s.h}</h3>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 10px' }}>{s.p}</p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>{s.who}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="step5-arrow">{'···›'}</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── AIDE & QUESTIONS FRÉQUENTES (FAQ) ──────────────── */}
        <section id="faq" style={{ padding: '80px 0', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,5vw,32px)' }}>
            <div style={{ textTransform: 'center', textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div className="hero-eyebrow">Centre d'aide</div>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--navy)', margin: '6px 0 10px', fontWeight: 800 }}>
                Questions Fréquentes (FAQ)
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 15 }}>
                Retrouvez les réponses aux questions les plus posées sur le fonctionnement de la plateforme SyLOC.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '18px 24px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--navy)',
                      }}
                    >
                      <span>{item.q}</span>
                      <span style={{ fontSize: 16, color: 'var(--gold-deep)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s' }}>
                        ▼
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 24px 20px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, borderTop: '1px solid var(--border)' }}>
                        <p style={{ margin: '14px 0 0' }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="pub-footer">
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,5vw,56px) clamp(16px,5vw,72px) 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 32 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <AppLogo height={38} showText={true} variant="footer" />
            </div>
            <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
              Système officiel de gestion du patrimoine locatif du Centre Régional des Oeuvres Universitaires de Thiès.
            </p>
          </div>
          {[
            { title: 'Démarches', links: [['Créer un compte', '/signup'], ['Se connecter', '#']] },
            { title: 'Ressources', links: [['Annonces', '#annonces'], ['Procédure', '#procedure'], ['Questions Fréquentes (FAQ)', '#faq']] },
            { title: 'Bureau du courrier', links: [['DCUVE / CROUS-T', '#'], ['Campus social VCN', '#'], ['Thiès, Sénégal', '#'], ['dcuve@crous-t.sn', '#']] },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ color: '#fff', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 16px', fontFamily: 'var(--font-mono)' }}>{col.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href} style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          © 2026 CROUS-T : Direction des Cités Universitaires et de la Vie Estudiantine
        </div>
      </footer>

      {/* ── MODAL CONNEXION ───────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ background: 'var(--surface)' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--muted)', lineHeight: 1 }}
              aria-label="Fermer"
            >
              ×
            </button>

            <div style={{ marginBottom: 20 }}>
              <AppLogo height={38} showText={true} />
            </div>

            {/* Demo chips */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <strong style={{ display: 'block', marginBottom: 10, color: 'var(--navy)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', fontFamily: 'var(--font-mono)' }}>
                Accès Démonstration
              </strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DEMO_PROFILES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedKey(p.key)}
                    className={`demo-chip ${selectedKey === p.key ? 'active' : ''}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 7 }}>E-mail</label>
                <input
                  type="email"
                  value={DEMO_ACCOUNTS[selectedKey]?.email || ''}
                  readOnly
                  style={{ width: '100%', padding: '13px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--navy)', marginBottom: 7 }}>Mot de passe</label>
                <input
                  type="password"
                  defaultValue="password"
                  readOnly
                  style={{ width: '100%', padding: '13px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text)' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-navy"
                style={{ width: '100%', fontSize: 15, padding: '14px', opacity: loading ? 0.6 : 1, justifyContent: 'center' }}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, color: 'var(--muted)' }}>
              Pas encore de compte ?{' '}
              <Link to="/signup" onClick={() => setShowModal(false)} style={{ color: 'var(--navy)', fontWeight: 700 }}>Créer un compte</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
