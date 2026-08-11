import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Card } from '../components/ui';

export default function Signup() {
  const [form, setForm] = useState({ nom: '', email: '', password: '', estEtudiant: false });
  const [carteFichier, setCarteFichier] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.nom.trim().length < 2) nextErrors.nom = 'Entrez votre nom complet.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Entrez une adresse e-mail valide.';
    if (form.password.length < 8) nextErrors.password = '8 caractères minimum.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    // TODO(SYL-18): POST /api/auth/register/ puis, si estEtudiant + carteFichier,
    // POST /api/accounts/demandeurs/soumettre-carte-etudiant/ (multipart/form-data)
    setTimeout(() => {
      login('demandeur');
      setLoading(false);
      navigate('/app');
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <Card>
        <h1 className="font-display text-xl font-semibold mb-1">Créer votre espace personnel</h1>
        <p className="text-sm text-muted mb-6">Nécessaire pour déposer une demande et suivre son instruction.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Nom complet" error={errors.nom}>
            <input value={form.nom} onChange={set('nom')} placeholder="Ex. Aïssatou Ndiaye"
                   className="w-full border border-navy-pale rounded px-3 py-2.5 bg-soft focus:bg-white focus:border-navy outline-none" />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com"
                   className="w-full border border-navy-pale rounded px-3 py-2.5 bg-soft focus:bg-white focus:border-navy outline-none" />
          </Field>
          <Field label="Mot de passe" hint="8 caractères minimum" error={errors.password}>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
                   className="w-full border border-navy-pale rounded px-3 py-2.5 bg-soft focus:bg-white focus:border-navy outline-none" />
          </Field>

          <label className="flex items-center gap-2.5 mb-4 text-sm">
            <input type="checkbox" checked={form.estEtudiant} onChange={set('estEtudiant')} className="w-4 h-4" />
            Je suis étudiant(e)
          </label>

          {form.estEtudiant && (
            <div className="mb-5 bg-soft border border-navy-pale rounded p-4">
              <label className="block text-sm font-semibold mb-2">Carte étudiante</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setCarteFichier(e.target.files[0])}
                     className="text-sm" />
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Vérifiée par un agent avant de débloquer la gratuité sur les locaux artisanaux et
                le droit de laisser des avis sur les cantines.
              </p>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-5">
          Déjà un compte ? <Link to="/connexion" className="text-navy font-semibold underline">Se connecter</Link>
        </p>
      </Card>
    </div>
  );
}
