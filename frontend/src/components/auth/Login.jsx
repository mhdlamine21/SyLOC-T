import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageWrapper, Card, Button, Field } from "../common/ui";
import Footer from "../common/Footer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = error.message || "Identifiants incorrects";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Card style={{ width: '100%', maxWidth: 440, padding: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--navy)', textAlign: 'center', marginBottom: 24 }}>
            Connexion SyLOC-T
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                ⚡ Sélection rapide (Démo) :
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setEmail(e.target.value);
                    setPassword('password123');
                  }
                }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '2px solid var(--gold)', background: 'var(--surface-2)',
                  color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option value="">-- Choisir un profil --</option>
                <option value="usager_etudiant">🎓 Usager / Candidat Étudiant (usager_etudiant)</option>
                <option value="amicale_gestionnaire">🏛 Amicale Étudiante (amicale_gestionnaire)</option>
                <option value="occupant_titulaire">🏪 Occupant Titulaire (occupant_titulaire)</option>
                <option value="bureau_courrier">📥 Bureau du Courrier (bureau_courrier)</option>
                <option value="directeur_dcuve">📂 Directeur DCUVE (directeur_dcuve)</option>
                <option value="directeur_crous">👑 Directeur Général CROUS-T (directeur_crous)</option>
                <option value="agent_juridique">⚖ Service Juridique (agent_juridique)</option>
                <option value="agent_comptable">💳 Service Comptable (agent_comptable)</option>
                <option value="agent_technique">🔧 Service Technique (agent_technique)</option>
                <option value="agent_terrain">🚨 Agent de Terrain (agent_terrain)</option>
                <option value="agent_qrmse">🧹 Bureau QHSE (agent_qrmse)</option>
                <option value="cellule_comm">📢 Cellule Communication (cellule_comm)</option>
                <option value="admin_si">💻 Administrateur Système (admin_si)</option>
              </select>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

            <Field label="Identifiant / Email">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre.identifiant"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface-2)',
                  color: 'var(--text)', fontSize: 14
                }}
              />
            </Field>

            <Field label="Mot de passe">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface-2)',
                  color: 'var(--text)', fontSize: 14
                }}
              />
            </Field>

            <Button variant="primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--slate)' }}>
            Nouveau sur le portail ?{' '}
            <Link to="/signup" className="font-bold" style={{ color: 'var(--gold-deep)', textDecoration: 'none' }}>
              Créer un compte usager
            </Link>
          </p>

          <footer style={{ marginTop: 'auto', paddingTop: 40, paddingBottom: 20, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
            © 2026 CROUS de Thiès - SyLOC-T. Tous droits réservés.
          </footer>
        </Card>
      </div>
      <Footer />
    </PageWrapper>
  );
}
