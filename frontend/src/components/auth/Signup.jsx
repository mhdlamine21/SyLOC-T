import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/syloct-logo-complet.svg";

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const newUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        role: "USAGER",
        type_usager: typeUsager,
        nom_complet: `${formData.prenom} ${formData.nom}`.trim(),
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        est_etudiant: typeUsager === "ETUDIANT",
        statut_verification_etudiant: typeUsager === "ETUDIANT" ? "EN_ATTENTE" : "NON_SOUMIS",
        service: typeUsager === "CANDIDAT" ? "Candidat commercial" : "Usager campus",
      };
      login(newUser, "token-session-demo");
      toast.success("Compte créé avec succès. Bienvenue sur SyLOC-T.");
      navigate("/dashboard");
    } catch {
      toast.error("Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 13px",
    border: "1px solid rgba(32,28,20,0.14)", background: "var(--paper2)",
    fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--ink)",
    outline: "none", transition: "border-color 0.15s, background 0.15s",
  };

  const labelStyle = { display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, fontFamily: "inherit" };
  const fieldStyle = { marginBottom: 18 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", fontFamily: "Inter, sans-serif" }}>
      {/* Colonne gauche — Illustration & Identité */}
      <div style={{ flex: "0 0 420px", background: "var(--teal-deep)", color: "var(--paper)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }} className="hidden md:flex">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <img src={logo} alt="CROUS-T" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <div style={{ fontFamily: "Zilla Slab, serif", fontWeight: 600, fontSize: 16 }}>CROUS-T · Site VCN</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8fbcae" }}>Gestion Locatif Officiel</div>
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Votre espace personnel
            </div>
            <h2 style={{ fontFamily: "Zilla Slab, serif", fontSize: "clamp(1.6rem, 2.5vw, 2rem)", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.15 }}>
              Gérez vos candidatures et suivez leur avancement en temps réel.
            </h2>
            <p style={{ fontSize: 14.5, color: "rgba(243,238,225,0.7)", lineHeight: 1.65, margin: 0 }}>
              Un compte candidat vous permet de déposer votre dossier de demande d'occupation de local, de soumettre vos pièces jointes et de suivre chaque étape de l'instruction.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Dépôt de dossier en ligne", "Suivi en temps réel", "Notifications automatiques", "Espace sécurisé et confidentiel"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5, color: "rgba(243,238,225,0.8)" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(127,217,160,0.2)", border: "1px solid rgba(127,217,160,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#7fd9a0", flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(243,238,225,0.35)", margin: 0, fontFamily: "IBM Plex Mono, monospace" }}>
          © 2026 CROUS-T — Université Iba Der Thiam de Thiès
        </p>
      </div>

      {/* Colonne droite — Formulaire */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontFamily: "IBM Plex Mono, monospace", color: "var(--teal)", textDecoration: "none", fontWeight: 600, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "Zilla Slab, serif", fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Créer votre compte</h1>
            <p style={{ fontSize: 14, color: "#6b644c", margin: 0 }}>
              Déjà inscrit ?{" "}
              <Link to="/login" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
            </p>
          </div>

          {/* Note d'information */}
          <div style={{ background: "rgba(31,75,63,0.07)", border: "1px solid rgba(31,75,63,0.15)", padding: "12px 14px", marginBottom: 28, fontSize: 12.5, color: "var(--teal)", lineHeight: 1.55 }}>
            L'inscription publique est réservée aux <strong>Candidats aux locaux</strong> et aux <strong>Étudiants / Visiteurs</strong>. Les comptes du personnel sont créés par la Direction.
          </div>

          {/* Sélection du type de compte */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ ...labelStyle }}>Je souhaite m'inscrire en tant que</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { key: "CANDIDAT", icon: "💼", title: "Candidat", desc: "Dossier de demande d'un local commercial" },
                { key: "ETUDIANT", icon: "🎓", title: "Etudiant / Visiteur", desc: "Avis cantines, signalements, vie du campus" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTypeUsager(t.key); setFormData((f) => ({ ...f, est_etudiant: t.key === "ETUDIANT" })); }}
                  style={{
                    padding: "14px", border: `2px solid ${typeUsager === t.key ? "var(--teal)" : "rgba(32,28,20,0.14)"}`,
                    background: typeUsager === t.key ? "rgba(31,75,63,0.07)" : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{t.icon} <strong style={{ fontFamily: "Zilla Slab, serif", color: "var(--ink)" }}>{t.title}</strong></div>
                  <div style={{ fontSize: 12, color: "#6b644c" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex. Aïssatou" style={inputStyle} required
                  onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex. Ndiaye" style={inputStyle} required
                  onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                />
              </div>
            </div>

            <div style={{ ...fieldStyle }}>
              <label style={labelStyle}>Adresse e-mail *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="vous@exemple.com" style={inputStyle} required
                onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="77 123 45 67" style={inputStyle} required
                  onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Adresse *</label>
                <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Quartier, Thiès" style={inputStyle} required
                  onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                />
              </div>
            </div>

            <div style={{ ...fieldStyle }}>
              <label style={labelStyle}>Mot de passe *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="8 caractères minimum"
                  style={inputStyle}
                  required
                  minLength={8}
                  onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b644c", fontSize: 11.5, fontFamily: "IBM Plex Mono, monospace" }}
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            {typeUsager === "ETUDIANT" && (
              <div style={{ background: "rgba(201,138,44,0.08)", border: "1px solid rgba(201,138,44,0.2)", padding: "14px 16px", marginBottom: 20 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>
                  Carte étudiante (photo ou PDF) — optionnel mais recommandé
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setCarteFichier(e.target.files[0])}
                  style={{ width: "100%", fontSize: 12.5, color: "#6b644c" }}
                />
                <p style={{ fontSize: 11.5, color: "#6b644c", marginTop: 8, marginBottom: 0 }}>
                  Sera vérifiée par un agent DCUVE pour débloquer la gratuité et le droit de vote cantines.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: "var(--teal)", color: "var(--paper)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 15, padding: "15px 22px", minHeight: 48,
                opacity: loading ? 0.6 : 1, fontFamily: "inherit", marginTop: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = "var(--teal-deep)"; }}
              onMouseLeave={e => { e.target.style.background = "var(--teal)"; }}
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
