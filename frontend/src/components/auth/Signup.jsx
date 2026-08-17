import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerApi } from "../../api/auth";
import { messageErreur } from "../../api/utils";
import AppLogo from "../common/AppLogo";

/* ─── Petits blocs de presentation ─────────────────────────────────── */

function Champ({ label, hint, children, required = true }) {
  return (
    <label className="su-field">
      <span className="su-label">
        {label} {required && <em className="su-req">*</em>}
      </span>
      {children}
      {hint && <span className="su-hint">{hint}</span>}
    </label>
  );
}

const CRITERES_MDP = [
  { cle: "longueur", texte: "8 caractères minimum", test: (v) => v.length >= 8 },
  { cle: "majuscule", texte: "Une majuscule", test: (v) => /[A-Z]/.test(v) },
  { cle: "chiffre", texte: "Un chiffre", test: (v) => /\d/.test(v) },
];

export default function Signup() {
  const [typeUsager, setTypeUsager] = useState("CANDIDAT");
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    telephone: "",
    adresse: "",
    est_etudiant: false,
  });
  const [carteFichier, setCarteFichier] = useState(null);
  const [matricule, setMatricule] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [conditions, setConditions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  /** Nom d'utilisateur dérivé de l'email (le backend exige un username unique). */
  const construireUsername = (email) =>
    email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30) ||
    `usager${Date.now().toString().slice(-6)}`;

  const forceMdp = useMemo(
    () => CRITERES_MDP.filter((c) => c.test(formData.password)).length,
    [formData.password],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    const estEtudiant = typeUsager === "ETUDIANT";
    if (estEtudiant && !matricule.trim()) {
      setErreur("Le matricule est obligatoire pour une inscription étudiante.");
      return;
    }
    if (!conditions) {
      setErreur("Vous devez accepter les conditions d'utilisation du service.");
      return;
    }
    setLoading(true);
    try {
      // Inscription réelle : création du compte USAGER + profil Demandeur
      // (+ upload de la carte étudiant en multipart si elle est fournie).
      await registerApi({
        username: construireUsername(formData.email),
        email: formData.email,
        password: formData.password,
        nom_complet: `${formData.prenom} ${formData.nom}`.trim(),
        contact: [formData.telephone, formData.adresse].filter(Boolean).join(" - "),
        est_etudiant: estEtudiant,
        matricule_etudiant: estEtudiant ? matricule.trim() : "",
        carte_etudiant_fichier: estEtudiant ? carteFichier : null,
      });

      // Connexion immédiate avec les identifiants saisis.
      await login(formData.email, formData.password);
      toast.success("Compte créé avec succès. Bienvenue sur SyLOC-T.");
      navigate("/dashboard");
    } catch (err) {
      const message = messageErreur(err, "Erreur lors de la création du compte.");
      setErreur(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-page">
      {/* ── Colonne institutionnelle ─────────────────────────── */}
      <aside className="su-aside">
        <div>
          <AppLogo height={40} variant="dark" />
          <div className="su-aside-body">
            <span className="su-kicker">Votre espace personnel</span>
            <h2 className="su-aside-title">
              Déposez votre dossier et suivez son instruction, étape par étape.
            </h2>
            <p className="su-aside-text">
              Un compte SyLOC-T vous donne accès au catalogue des locaux domaniaux du
              CROUS de Thiès, au dépôt de vos pièces justificatives et au suivi officiel
              de chaque décision.
            </p>
          </div>

          <ul className="su-benefits">
            {[
              [<DescriptionOutlinedIcon key="a" style={{ fontSize: 20 }} />, "Dépôt de dossier 100 % en ligne"],
              [<SearchOutlinedIcon key="b" style={{ fontSize: 20 }} />, "Suivi d'instruction en temps réel"],
              [<NotificationsNoneOutlinedIcon key="c" style={{ fontSize: 20 }} />, "Notifications à chaque décision"],
              [<LockOutlinedIcon key="d" style={{ fontSize: 20 }} />, "Données personnelles protégées"],
            ].map(([icone, texte]) => (
              <li key={texte}>
                <span className="su-benefit-icon" aria-hidden="true">{icone}</span>
                {texte}
              </li>
            ))}
          </ul>
        </div>

        <p className="su-aside-legal">
          © {new Date().getFullYear()} CROUS de Thiès - Université Iba Der Thiam
        </p>
      </aside>

      {/* ── Colonne formulaire ───────────────────────────────── */}
      <main className="su-main">
        <div className="su-card">
          <Link to="/" className="su-back">← Retour à l'accueil</Link>

          <header className="su-head">
            <h1 className="su-title">Créer votre compte</h1>
            <p className="su-sub">
              Déjà inscrit ? <Link to="/login" className="su-link">Se connecter</Link>
            </p>
          </header>

          <div className="su-note">
            L'inscription publique est réservée aux <strong>candidats aux locaux</strong> et
            aux <strong>étudiants du campus</strong>. Les comptes du personnel sont créés
            par la Direction.
          </div>

          <form onSubmit={handleSubmit} noValidate={false}>
            {/* Etape 1 - profil */}
            <section className="su-step">
              <div className="su-step-head">
                <span className="su-step-num">1</span>
                <div>
                  <h2 className="su-step-title">Type de compte</h2>
                  <p className="su-step-text">Choisissez le profil correspondant à votre situation.</p>
                </div>
              </div>

              <div className="su-choices">
                {[
                  { key: "CANDIDAT", icon: <WorkOutlineOutlinedIcon style={{ fontSize: 22 }} />, title: "Candidat", desc: "Demande d'un local commercial" },
                  { key: "ETUDIANT", icon: <SchoolOutlinedIcon style={{ fontSize: 22 }} />, title: "Étudiant", desc: "Avis cantines, vie du campus" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={typeUsager === t.key}
                    onClick={() => {
                      setTypeUsager(t.key);
                      setFormData((f) => ({ ...f, est_etudiant: t.key === "ETUDIANT" }));
                    }}
                    className={`su-choice ${typeUsager === t.key ? "is-active" : ""}`}
                  >
                    <span className="su-choice-icon" aria-hidden="true">{t.icon}</span>
                    <span className="su-choice-title">{t.title}</span>
                    <span className="su-choice-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Etape 2 - identite */}
            <section className="su-step">
              <div className="su-step-head">
                <span className="su-step-num">2</span>
                <div>
                  <h2 className="su-step-title">Votre identité</h2>
                  <p className="su-step-text">Ces informations figureront sur vos actes officiels.</p>
                </div>
              </div>

              <div className="su-grid-2">
                <Champ label="Prénom">
                  <input className="su-input" type="text" name="prenom" value={formData.prenom}
                    onChange={handleChange} placeholder="Aïssatou" required autoComplete="given-name" />
                </Champ>
                <Champ label="Nom">
                  <input className="su-input" type="text" name="nom" value={formData.nom}
                    onChange={handleChange} placeholder="Ndiaye" required autoComplete="family-name" />
                </Champ>
              </div>

              <Champ label="Adresse e-mail" hint="Elle servira d'identifiant de connexion.">
                <input className="su-input" type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="vous@exemple.com" required autoComplete="email" />
              </Champ>

              <div className="su-grid-2">
                <Champ label="Téléphone">
                  <input className="su-input" type="tel" name="telephone" value={formData.telephone}
                    onChange={handleChange} placeholder="77 123 45 67" required autoComplete="tel" />
                </Champ>
                <Champ label="Adresse">
                  <input className="su-input" type="text" name="adresse" value={formData.adresse}
                    onChange={handleChange} placeholder="Quartier, Thiès" required autoComplete="street-address" />
                </Champ>
              </div>
            </section>

            {/* Etape 3 - securite */}
            <section className="su-step">
              <div className="su-step-head">
                <span className="su-step-num">3</span>
                <div>
                  <h2 className="su-step-title">Sécurité du compte</h2>
                  <p className="su-step-text">Choisissez un mot de passe solide.</p>
                </div>
              </div>

              <Champ label="Mot de passe">
                <div className="su-password">
                  <input
                    className="su-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="8 caractères minimum"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button type="button" className="su-eye" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </Champ>

              <div className="su-strength" aria-live="polite">
                <div className="su-strength-bar">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`su-strength-seg ${forceMdp > i ? `lvl-${forceMdp}` : ""}`} />
                  ))}
                </div>
                <ul className="su-criteria">
                  {CRITERES_MDP.map((c) => (
                    <li key={c.cle} className={c.test(formData.password) ? "ok" : ""}>
                      {c.test(formData.password) ? "✓" : "•"} {c.texte}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Etape 4 - piece etudiante */}
            {typeUsager === "ETUDIANT" && (
              <section className="su-step su-step-student">
                <div className="su-step-head">
                  <span className="su-step-num">4</span>
                  <div>
                    <h2 className="su-step-title">Justificatif étudiant</h2>
                    <p className="su-step-text">
                      Vérifié par un agent DCUVE pour débloquer la gratuité et le droit de vote cantines.
                    </p>
                  </div>
                </div>

                <Champ label="Matricule étudiant">
                  <input className="su-input" type="text" value={matricule}
                    onChange={(e) => setMatricule(e.target.value)} placeholder="2023UIDT0456" required />
                </Champ>

                <Champ label="Carte étudiante (photo ou PDF)" required={false}
                  hint="Facultatif, mais accélère fortement la vérification.">
                  <input className="su-file" type="file" accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setCarteFichier(e.target.files[0])} />
                </Champ>
              </section>
            )}

            <label className="su-terms">
              <input type="checkbox" checked={conditions} onChange={(e) => setConditions(e.target.checked)} />
              <span>
                J'atteste l'exactitude des informations fournies et j'accepte les conditions
                d'utilisation du service SyLOC-T.
              </span>
            </label>

            {erreur && <div className="su-error" role="alert">{erreur}</div>}

            <button type="submit" className="su-submit" disabled={loading}>
              {loading ? "Création en cours…" : "Créer mon compte"}
            </button>

            <p className="su-footnote">
              Un accusé de création vous sera envoyé à l'adresse renseignée.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

