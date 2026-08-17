import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { messageErreur } from "../../api/utils";
import logo from "../../assets/syloct-logo-complet.svg";



export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Bienvenue, ${user.nom_complet || user.username} !`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(messageErreur(error, "Identifiants invalides"));

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", fontFamily: "Inter, sans-serif" }}>
      {/* Colonne gauche - Illustration & Identité */}
      <div style={{ flex: "0 0 420px", background: "var(--navy-2)", color: "var(--text-on-navy)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }} className="hidden md:flex">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ background: "#fff", padding: 6, borderRadius: 12, display: "flex", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <img src={logo} alt="CROUS-T" style={{ width: 42, height: 42, objectFit: "contain", borderRadius: 6 }} />
            </div>
            <div>
              <div style={{ fontFamily: "Zilla Slab, serif", fontWeight: 600, fontSize: 16 }}>CROUS-T · Site VCN</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8fbcae" }}>Gestion Locatif Officiel</div>
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Accès sécurisé
            </div>
            <h2 style={{ fontFamily: "Zilla Slab, serif", fontSize: "clamp(1.6rem, 2.5vw, 2rem)", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.15 }}>
              Connectez-vous à votre espace personnel.
            </h2>
            <p style={{ fontSize: 14.5, color: "rgba(243,238,225,0.7)", lineHeight: 1.65, margin: 0 }}>
              Retrouvez l'ensemble de vos démarches, paiements et contrats dans un environnement sécurisé et centralisé.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(243,238,225,0.35)", margin: 0, fontFamily: "IBM Plex Mono, monospace" }}>
          © 2026 CROUS-T - Université Iba Der Thiam de Thiès
        </p>
      </div>

      {/* Colonne droite - Formulaire */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontFamily: "IBM Plex Mono, monospace", color: "var(--teal)", textDecoration: "none", fontWeight: 600, marginBottom: 32 }}>
            ← Retour à l'accueil
          </Link>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "Zilla Slab, serif", fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Bon retour !</h1>
            <p style={{ fontSize: 14, color: "#6b644c", margin: 0 }}>
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="username" style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, fontFamily: "inherit" }}>Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(32,28,20,0.14)", background: "var(--paper2)", fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--ink)", outline: "none", transition: "border-color 0.15s, background 0.15s" }}
                onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                placeholder="Ex: admin"
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label htmlFor="password" style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 7, fontFamily: "inherit" }}>Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(32,28,20,0.14)", background: "var(--paper2)", fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--ink)", outline: "none", transition: "border-color 0.15s, background 0.15s" }}
                onFocus={e => { e.target.style.borderColor = "var(--teal)"; e.target.style.background = "var(--paper)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(32,28,20,0.14)"; e.target.style.background = "var(--paper2)"; }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: "var(--navy)", color: "var(--text-on-navy)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 15, padding: "15px 22px", minHeight: 48,
                opacity: loading ? 0.6 : 1, fontFamily: "inherit", marginTop: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = "var(--teal-deep)"; }}
              onMouseLeave={e => { e.target.style.background = "var(--teal)"; }}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, marginTop: 24, color: "#6b644c" }}>
            Pas encore de compte ?{" "}
            <Link to="/signup" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


